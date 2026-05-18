const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const scenarios = require('./config/scenarios.json');
const targets = require('./config/targets.json');
const gs = require('./gameState');

// Fail fast if config files are empty — better to crash now than mid-game
if (!scenarios.length) throw new Error('scenarios.json is empty — add at least one scenario');
if (!targets.length) throw new Error('targets.json is empty — add at least one target card');

const IS_PROD = process.env.NODE_ENV === 'production';
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];
const PORT = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────
// In production the client is served from the same origin — no CORS needed.
// In dev the Vite dev server runs on a different port, so we allow it.
const io = new Server(server, {
  cors: IS_PROD
    ? { origin: false }
    : { origin: DEV_ORIGINS, methods: ['GET', 'POST'] },
});

// ── Middleware ────────────────────────────────────────────────────────────────

// Security headers (no external package needed)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// HTTP CORS: only needed in dev (in production, client is same-origin)
if (!IS_PROD) {
  app.use(cors({ origin: DEV_ORIGINS }));
}

app.use(express.json());

// Serve built client in production
if (IS_PROD) {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function broadcastRoom(room) {
  if (!room) return;
  room.lastActivity = Date.now(); // keep room alive while players are active
  room.players.forEach((player) => {
    const socketId = player.socketId;
    if (socketId) {
      const state = gs.getRoomStateFor(room, player.id);
      io.to(socketId).emit('room-updated', state);
    }
  });
}

function startTimerTick(room) {
  gs.clearTimerInterval(room);
  room.timerInterval = setInterval(() => {
    const r = gs.tickTimer(room.code);
    if (!r) return;

    broadcastRoom(r);

    if (r.timer.remainingSec <= 0) {
      gs.clearTimerInterval(r);
      r.timer.running = false;
      // Award witness points BEFORE endRound so scores are in the broadcast
      const witness = r.players.find((p) => p.role === 'witness');
      if (witness) gs.awardPoints(r.code, witness.id, gs.cfg.scoring.witnessTimerWin);
      // endRound returns null if already ended (race guard)
      const ended = gs.endRound(r.code, 'timer', null);
      if (ended) broadcastRoom(ended);
    }
  }, 1000);
}

function handlePostRemoval(roomCode, updated) {
  if (!updated) return;

  // If witness was removed during a live game, auto-end the round (no points)
  if (updated._witnessDisconnected && updated.phase === 'playing') {
    updated._witnessDisconnected = false;
    const ended = gs.endRound(roomCode, 'witness-left', null);
    if (ended) {
      broadcastRoom(ended);
      return;
    }
  }

  // If no connected lawyers remain during a live game, auto-end the round (no points)
  if (updated.phase === 'playing') {
    const lawyersLeft = updated.players.filter(
      (player) => player.role === 'lawyer' && player.connected !== false
    ).length;
    if (lawyersLeft === 0) {
      const ended = gs.endRound(roomCode, 'manual', null);
      if (ended) {
        broadcastRoom(ended);
        return;
      }
    }
  }

  broadcastRoom(updated);
}

// ── Socket handlers ───────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  // Create a new room
  socket.on('create-room', ({ name, playerId }) => {
    const cleanName = (name || '').trim().slice(0, 20);
    if (!cleanName) {
      socket.emit('error', { message: 'Name cannot be empty' });
      return;
    }
    const id = playerId || socket.id;
    const room = gs.createRoom(socket.id, cleanName);
    // Update the player's id to the persistent playerId if provided
    room.players[0].id = id;
    room.players[0].socketId = socket.id;
    room.hostId = id;
    socket.join(room.code);
    socket.emit('room-created', { roomCode: room.code, playerId: id });
    broadcastRoom(room);
  });

  // Join an existing room (also handles reconnection)
  socket.on('join-room', ({ code, name, playerId }) => {
    const upperCode = (code || '').toUpperCase().trim();
    if (!upperCode) {
      socket.emit('error', { message: 'Room code is required' });
      return;
    }
    const id = playerId || socket.id;
    const result = gs.addPlayer(upperCode, id, name, socket.id);
    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }
    socket.join(upperCode);
    socket.emit('room-joined', { roomCode: upperCode, playerId: id });
    broadcastRoom(result.room);
  });

  // Host starts the game
  socket.on('start-game', ({ code, timerSec }) => {
    const room = gs.getRoom(code);
    if (!room) return;
    if (room.phase !== 'waiting') {
      socket.emit('error', { message: 'Game already started' });
      return;
    }
    // Verify caller is host (by socketId or playerId)
    const caller = room.players.find((p) => p.socketId === socket.id);
    if (!caller || caller.id !== room.hostId) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }
    const result = gs.startGame(code, scenarios, targets, timerSec);
    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }
    broadcastRoom(result.room);
  });

  // Timer control (witness only)
  socket.on('timer-action', ({ code, action }) => {
    const room = gs.getRoom(code);
    if (!room || room.phase !== 'playing') return;
    const caller = room.players.find((p) => p.socketId === socket.id);
    if (!caller || caller.role !== 'witness') return;
    if (!['start', 'pause', 'reset'].includes(action)) return;
    if (room.pendingObjection) return; // objection must be ruled on before any timer changes

    const updated = gs.setTimer(code, action);
    if (!updated) return;

    if (action === 'start') {
      startTimerTick(updated);
    } else {
      gs.clearTimerInterval(updated);
    }

    broadcastRoom(updated);
  });

  // Rotate to next lawyer (witness only, no pending objection)
  socket.on('rotate-lawyer', ({ code }) => {
    const room = gs.getRoom(code);
    if (!room) return;
    const caller = room.players.find((p) => p.socketId === socket.id);
    if (!caller || caller.role !== 'witness') return;
    if (room.pendingObjection) return; // must resolve objection first

    const updated = gs.rotateLawyer(code);
    broadcastRoom(updated);
  });

  // Spend an objection token (non-active lawyers only, no double-pending)
  socket.on('spend-token', ({ code }) => {
    const room = gs.getRoom(code);
    if (!room || room.phase !== 'playing') return;
    const caller = room.players.find((p) => p.socketId === socket.id);
    if (!caller || caller.role !== 'lawyer') return;
    if (caller.objectionTokens <= 0) return;

    // Cannot object on your own turn
    const activeLawyer = room.players[room.activeLawyerIndex];
    if (activeLawyer && activeLawyer.id === caller.id) return;

    // Cannot raise a second objection while one is already pending
    if (room.pendingObjection) return;

    const updated = gs.spendToken(code, caller.id);
    if (!updated) return;

    // Record the pending objection so the witness can rule
    updated.pendingObjection = { lawyerId: caller.id, lawyerName: caller.name };

    // Auto-pause the timer while the objection is being ruled on
    if (updated.timer.running) {
      gs.clearTimerInterval(updated);
      updated.timer.running = false;
      updated._timerPausedByObjection = true;
    }

    broadcastRoom(updated);
  });

  // Witness sustains the objection → rotate to next lawyer
  socket.on('sustain-objection', ({ code }) => {
    const room = gs.getRoom(code);
    if (!room || room.phase !== 'playing') return;
    const caller = room.players.find((p) => p.socketId === socket.id);
    if (!caller || caller.role !== 'witness') return;
    if (!room.pendingObjection) return;

    room.pendingObjection = null;
    const updated = gs.rotateLawyer(code);
    const result = updated || room;

    // Auto-resume timer if it was paused by the objection
    if (result._timerPausedByObjection && result.timer.remainingSec > 0) {
      result._timerPausedByObjection = false;
      result.timer.running = true;
      startTimerTick(result);
    }

    broadcastRoom(result);
  });

  // Witness dismisses the objection → objecting lawyer loses another token
  socket.on('dismiss-objection', ({ code }) => {
    const room = gs.getRoom(code);
    if (!room || room.phase !== 'playing') return;
    const caller = room.players.find((p) => p.socketId === socket.id);
    if (!caller || caller.role !== 'witness') return;
    if (!room.pendingObjection) return;

    const { lawyerId } = room.pendingObjection;
    room.pendingObjection = null;
    const updated = gs.spendToken(code, lawyerId); // costs objector their second token
    const result = updated || room;

    // Auto-resume timer if it was paused by the objection
    if (result._timerPausedByObjection && result.timer.remainingSec > 0) {
      result._timerPausedByObjection = false;
      result.timer.running = true;
      startTimerTick(result);
    }

    broadcastRoom(result);
  });

  // Lawyer reveals target and wins the round
  socket.on('reveal-target', ({ code }) => {
    const room = gs.getRoom(code);
    if (!room || room.phase !== 'playing') return;
    const caller = room.players.find((p) => p.socketId === socket.id);
    if (!caller || caller.role !== 'lawyer') return;
    if (room.pendingObjection) return;

    const activeLawyer = room.players[room.activeLawyerIndex];
    if (!activeLawyer || activeLawyer.id !== caller.id) return;

    // Award points before endRound so they're included in the broadcast
    gs.awardPoints(code, caller.id, gs.cfg.scoring.lawyerRevealLawyer);
    const witness = room.players.find((p) => p.role === 'witness');
    if (witness) gs.awardPoints(code, witness.id, gs.cfg.scoring.lawyerRevealWitness);

    // endRound returns null if phase was already changed (race condition guard)
    const ended = gs.endRound(code, 'lawyer-win', caller.id);
    if (!ended) return; // another reveal beat us to it
    broadcastRoom(ended);
  });

  // Witness manually ends round — no points awarded (no winner)
  // Timer expiry is handled automatically by startTimerTick with auto point award
  socket.on('end-round', ({ code }) => {
    const room = gs.getRoom(code);
    if (!room || room.phase !== 'playing') return;
    const caller = room.players.find((p) => p.socketId === socket.id);
    if (!caller || caller.role !== 'witness') return;
    if (room.pendingObjection) return;

    const ended = gs.endRound(code, 'manual', null);
    if (ended) broadcastRoom(ended);
  });

  // Start next round — controlled by the current round's witness
  // (falls back to host if the witness has already left)
  socket.on('next-round', ({ code }) => {
    const room = gs.getRoom(code);
    if (!room) return;
    if (room.phase !== 'round-end') return;
    const caller = room.players.find((p) => p.socketId === socket.id);
    if (!caller) return;

    const witnessStillPresent = room.players.some((p) => p.role === 'witness');
    const isCallerWitness = caller.role === 'witness';
    const isHostFallback = !witnessStillPresent && caller.id === room.hostId;
    if (!isCallerWitness && !isHostFallback) return;

    const result = gs.nextRound(code, scenarios, targets);
    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }
    broadcastRoom(result.room);
  });

  // Update timer config (host, waiting room only)
  socket.on('set-timer-config', ({ code, durationSec, isAuto }) => {
    const room = gs.getRoom(code);
    if (!room || room.phase !== 'waiting') return;
    const caller = room.players.find((p) => p.socketId === socket.id);
    if (!caller || caller.id !== room.hostId) return;

    const safeDuration = Math.floor(Number(durationSec));
    if (!Number.isFinite(safeDuration)) return;
    if (safeDuration < gs.cfg.timer.minSec || safeDuration > gs.cfg.timer.maxSec) return;

    room.timer.durationSec = safeDuration;
    room.timer.remainingSec = safeDuration;
    room.timer.isAuto = Boolean(isAuto);
    broadcastRoom(room);
  });

  // Explicit leave path so intentional leaves do not linger for the reconnect grace period.
  socket.on('leave-room', ({ code }, ack) => {
    const room = gs.getRoom(code);
    if (!room) {
      if (typeof ack === 'function') ack();
      return;
    }

    const caller = room.players.find((player) => player.socketId === socket.id);
    if (!caller) {
      if (typeof ack === 'function') ack();
      return;
    }

    socket.leave(code);
    const updated = gs.removePlayerById(code, caller.id);
    if (typeof ack === 'function') ack();
    handlePostRemoval(code, updated);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
    handleDisconnect(socket.id);
  });
});

function handleDisconnect(socketId) {
  const room = gs.findRoomBySocketId(socketId);
  if (!room) return;

  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) return;

  // Soft disconnect: mark as offline but keep them in the room.
  // Give them 30 seconds to reconnect (covers page refresh).
  player.connected = false;
  player.socketId = null;

  // Cancel any existing timeout (shouldn't happen, but be safe)
  if (player._reconnectTimeout) clearTimeout(player._reconnectTimeout);

  player._reconnectTimeout = setTimeout(() => {
    // Hard removal after grace period expires
    const currentRoom = gs.getRoom(room.code);
    if (!currentRoom) return;
    const p = currentRoom.players.find((p2) => p2.id === player.id);
    if (!p || p.connected) return; // they came back, nothing to do

    const updated = gs.removePlayerById(room.code, player.id);
    if (!updated) return; // room deleted (last player left)
    handlePostRemoval(room.code, updated);
  }, 30_000);

  // Broadcast immediately so other players see the disconnected state
  broadcastRoom(room);
}

// Delete rooms that have been idle for more than 2 hours (memory leak prevention)
setInterval(() => gs.cleanupStaleRooms(), 10 * 60 * 1000);

// ── Process-level error handlers ─────────────────────────────────────────────
// These ensure crashes are logged before Render restarts the process.
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

server.listen(PORT, () => {
  console.log(`OBJECTION! server running on http://localhost:${PORT}`);
});
