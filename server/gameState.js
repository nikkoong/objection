const cfg = require('./config/gameConfig.json');
const characterTraits = require('./config/characterTraits.json');

function generateWitnessCharacter() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const age = pick(characterTraits.ages);
  const job = pick(characterTraits.jobs);
  const workplace = pick(characterTraits.workplaces);
  const hobby = pick(characterTraits.hobbies);
  const trait = pick(characterTraits.traits);
  return `You are ${age} years old, work as a ${job} at ${workplace}. You like to ${hobby} and are ${trait}.`;
}

// In-memory store of all rooms
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createRoom(hostId, hostName) {
  const code = generateRoomCode();
  const room = {
    code,
    hostId,
    phase: 'waiting', // waiting | playing | round-end
    round: 0,
    witnessIndex: 0,
    activeLawyerIndex: 0,
    scenario: null,
    targets: {}, // { playerId: targetText }
    pendingObjection: null, // { lawyerId, lawyerName } while an objection is awaiting ruling
    lastActivity: Date.now(),
    players: [
      {
        id: hostId,
        name: hostName,
        score: 0,
        objectionTokens: cfg.tokens.defaultPerLawyer,
        role: 'lawyer', // assigned on start
        socketId: hostId,
        connected: true,
      },
    ],
    timer: {
      durationSec: cfg.timer.minSec, // placeholder; recalculated at game start (1 min/lawyer)
      remainingSec: cfg.timer.minSec,
      running: false,
    },
    timerInterval: null,
  };
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function addPlayer(code, playerId, playerName, socketId) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };

  // Validate name
  const name = (playerName || '').trim().slice(0, 20);
  if (!name) return { error: 'Name cannot be empty' };

  // Always allow reconnection of a known player regardless of phase
  const existing = room.players.find((p) => p.id === playerId);
  if (existing) {
    // Cancel any pending removal timeout (player reconnected in time)
    if (existing._reconnectTimeout) {
      clearTimeout(existing._reconnectTimeout);
      delete existing._reconnectTimeout;
    }
    existing.socketId = socketId;
    existing.connected = true;
    existing.name = name; // allow name refresh on reconnect
    return { room };
  }

  // New players can only join in waiting phase
  if (room.phase !== 'waiting') return { error: 'Game already in progress' };
  if (room.players.length >= cfg.players.max) {
    return { error: `Room is full (max ${cfg.players.max} players)` };
  }

  room.players.push({
    id: playerId,
    name,
    score: 0,
    objectionTokens: cfg.tokens.defaultPerLawyer,
    role: 'lawyer',
    socketId,
    connected: true,
  });
  return { room };
}

function removePlayer(code, socketId) {
  const room = rooms.get(code);
  if (!room) return null;

  const leaving = room.players.find((p) => p.socketId === socketId);
  room.players = room.players.filter((p) => p.socketId !== socketId);

  if (room.players.length === 0) {
    clearTimerInterval(room);
    rooms.delete(code);
    return null;
  }

  // If host left, reassign to first remaining player
  if (!room.players.find((p) => p.id === room.hostId)) {
    room.hostId = room.players[0].id;
  }

  // Keep witnessIndex in bounds
  if (room.witnessIndex >= room.players.length) {
    room.witnessIndex = 0;
  }

  // If the witness disconnected during a game, flag it so the server can react
  if (leaving && leaving.role === 'witness' && room.phase === 'playing') {
    room._witnessDisconnected = true;
  }

  return room;
}

// Remove a player by their persistent playerId (used after grace-period expires)
function removePlayerById(code, playerId) {
  const room = rooms.get(code);
  if (!room) return null;

  const leaving = room.players.find((p) => p.id === playerId);
  room.players = room.players.filter((p) => p.id !== playerId);

  if (room.players.length === 0) {
    clearTimerInterval(room);
    rooms.delete(code);
    return null;
  }

  if (!room.players.find((p) => p.id === room.hostId)) {
    room.hostId = room.players[0].id;
  }

  if (room.witnessIndex >= room.players.length) {
    room.witnessIndex = 0;
  }

  if (leaving && leaving.role === 'witness' && room.phase === 'playing') {
    room._witnessDisconnected = true;
  }

  return room;
}

function startGame(code, scenarios, targets, timerSec) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.phase !== 'waiting') return { error: 'Game already started' };
  if (room.players.length < cfg.players.min) {
    return { error: `Need at least ${cfg.players.min} players` };
  }
  if (room.players.length > cfg.players.max) {
    return { error: `Too many players (max ${cfg.players.max})` };
  }

  // Clamp timer to configured range
  const rawTimer = Number(timerSec) || 0;
  const clampedTimer =
    rawTimer >= cfg.timer.minSec && rawTimer <= cfg.timer.maxSec ? rawTimer : null;

  // Assign witness: player at witnessIndex
  const witnessIdx = room.witnessIndex % room.players.length;
  const isLargeGame = room.players.length >= cfg.tokens.largeGameThreshold;
  const tokenCount = isLargeGame
    ? cfg.tokens.largeGamePerLawyer
    : cfg.tokens.defaultPerLawyer;

  // Default timer: 1 minute per lawyer (everyone except the witness)
  const lawyerCount = room.players.length - 1;
  const autoTimerSec = Math.min(
    Math.max(lawyerCount * 60, cfg.timer.minSec),
    cfg.timer.maxSec
  );
  const timerDuration = clampedTimer || autoTimerSec;

  room.players.forEach((p, i) => {
    p.role = i === witnessIdx ? 'witness' : 'lawyer';
    p.objectionTokens = p.role === 'lawyer' ? tokenCount : 0;
    p.score = p.score || 0;
  });
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  room.scenario = scenario;
  room.witnessCharacter = generateWitnessCharacter();

  // Assign targets to lawyers
  const lawyers = room.players.filter((p) => p.role === 'lawyer');
  const shuffledTargets = shuffle(targets);
  room.targets = {};
  lawyers.forEach((lawyer, i) => {
    room.targets[lawyer.id] = shuffledTargets[i % shuffledTargets.length];
  });

  // First active lawyer: first lawyer in player order
  const firstLawyerIdx = room.players.findIndex((p) => p.role === 'lawyer');
  room.activeLawyerIndex = firstLawyerIdx;

  room.phase = 'playing';
  room.round += 1;
  room.pendingObjection = null;
  room.timer = {
    durationSec: timerDuration,
    remainingSec: timerDuration,
    running: false,
  };

  return { room };
}

function rotateLawyer(code) {
  const room = rooms.get(code);
  if (!room || room.phase !== 'playing') return null;

  const lawyers = room.players
    .map((p, i) => ({ ...p, idx: i }))
    .filter((p) => p.role === 'lawyer');

  if (lawyers.length === 0) return room;

  const currentPos = lawyers.findIndex((l) => l.idx === room.activeLawyerIndex);
  const nextPos = (currentPos + 1) % lawyers.length;
  room.activeLawyerIndex = lawyers[nextPos].idx;

  return room;
}

function spendToken(code, playerId) {
  const room = rooms.get(code);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;
  if (player.objectionTokens > 0) player.objectionTokens -= 1;
  return room;
}

function awardPoints(code, playerId, points) {
  const room = rooms.get(code);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;
  player.score += points;
  return room;
}

function endRound(code, reason, winnerLawyerId) {
  const room = rooms.get(code);
  if (!room) return null;
  // Guard: only end a round that is currently in progress
  if (room.phase !== 'playing') return null;
  clearTimerInterval(room);
  room.timer.running = false;
  room.phase = 'round-end';
  room.pendingObjection = null; // clear any in-flight objection
  room.roundResult = { reason, winnerLawyerId: winnerLawyerId || null };
  return room;
}

function nextRound(code, scenarios, targets) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };

  // Rotate witness clockwise
  room.witnessIndex = (room.witnessIndex + 1) % room.players.length;
  // Reset to 'waiting' so startGame's phase guard passes
  room.phase = 'waiting';
  return startGame(code, scenarios, targets, room.timer.durationSec);
}

function setTimer(code, action) {
  const room = rooms.get(code);
  if (!room || room.phase !== 'playing') return null;

  if (action === 'start') {
    room.timer.running = true;
  } else if (action === 'pause') {
    room.timer.running = false;
    clearTimerInterval(room);
  } else if (action === 'reset') {
    clearTimerInterval(room);
    room.timer.remainingSec = room.timer.durationSec;
    room.timer.running = false;
  }

  return room;
}

function tickTimer(code) {
  const room = rooms.get(code);
  if (!room || !room.timer.running) return null;
  if (room.timer.remainingSec > 0) {
    room.timer.remainingSec -= 1;
  }
  return room;
}

function clearTimerInterval(room) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
}

// Build a sanitized room state safe to send to a specific player
function getRoomStateFor(room, playerId) {
  const state = {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    round: room.round,
    witnessIndex: room.witnessIndex,
    scenario: room.scenario,
    activeLawyerIndex: room.activeLawyerIndex,
    roundResult: room.roundResult || null,
    pendingObjection: room.pendingObjection || null,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      objectionTokens: p.objectionTokens,
      role: p.role,
      connected: p.connected !== false, // true unless explicitly marked false
    })),
    timer: { ...room.timer },
    myTarget: room.targets[playerId] || null,
    // Witness-only character paragraph (MadLibs style background facts)
    witnessCharacter: room.players.find((p) => p.id === playerId)?.role === 'witness'
      ? (room.witnessCharacter || null)
      : null,
    // During round-end, reveal all targets
    allTargets: room.phase === 'round-end' ? room.targets : null,
  };
  return state;
}

function cleanupStaleRooms(maxAgeMs = 2 * 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs;
  for (const [code, room] of rooms) {
    if ((room.lastActivity || 0) < cutoff) {
      clearTimerInterval(room);
      rooms.delete(code);
      console.log('Expired stale room:', code);
    }
  }
}

function findRoomBySocketId(socketId) {
  for (const room of rooms.values()) {
    if (room.players.find((p) => p.socketId === socketId)) {
      return room;
    }
  }
  return null;
}

module.exports = {
  cfg, // expose so index.js can use scoring values without a separate import
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  removePlayerById,
  startGame,
  rotateLawyer,
  spendToken,
  awardPoints,
  endRound,
  nextRound,
  setTimer,
  tickTimer,
  clearTimerInterval,
  getRoomStateFor,
  findRoomBySocketId,
  cleanupStaleRooms,
};
