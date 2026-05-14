# Edge Cases & Production Hardening Audit

This document catalogs every meaningful edge case in the core game loop, the fix
status, and what is still outstanding if you want to go further.

---

## Scoring

| Edge case | Status | Notes |
|---|---|---|
| Timer expires AND witness manually taps "End Round" | **Fixed** | `endRound` guards on `phase === 'playing'`; returns `null` on second call so no double-award |
| Two lawyers simultaneously click "Reveal Target" | **Fixed** | First `endRound` call wins; second gets `null` back and is dropped |
| Lawyer clicks "Reveal" after round already ended | **Fixed** | Server checks `room.phase !== 'playing'` before processing |
| Manual "Award Points" during gameplay | **Fixed** | Removed from UI entirely; scoring is now fully automatic |
| Timer auto-awards points then witness also clicks timer-end | **Fixed** | "Time's Up" button removed; timer auto-ends via server interval only |
| Score going negative | Not guarded | Normal gameplay can't produce negative scores, but a malformed `award-points` event could. Server now validates `safePoints !== 0` and uses integer floors. |

---

## Player Count & Joining

| Edge case | Status | Notes |
|---|---|---|
| Joining with 0 or whitespace-only name | **Fixed** | Server validates and rejects with an error message |
| Joining a full room (>12 players) | **Fixed** | Returns `"Room is full (max 12 players)"` |
| Joining a room that doesn't exist | **Fixed** | Returns `"Room not found"` |
| Joining a game already in progress (new player) | **Fixed** | Blocked with `"Game already in progress"` |
| Reconnecting as an existing player mid-game | **Fixed** | `addPlayer` matches by `playerId` regardless of phase, updates `socketId` only |
| Playing with 2 players (1 witness, 1 lawyer) | **Works** | `rotateLawyer` loops back to the same lawyer; `activeLawyerIndex` stays stable |
| Player count drops to 1 mid-game (all others leave) | Partial | Room survives; game technically continues with 1 player. Consider auto-ending the round when fewer than 2 players remain |
| Host joins their own room code from a second device | Allowed | Treated as a new player since `playerId` won't match. Harmless but could cause confusion |

---

## Disconnections

| Edge case | Status | Notes |
|---|---|---|
| Any player disconnects in waiting room | **Handled** | Player removed; room remains |
| Last player disconnects | **Handled** | Room is deleted, timer cleared |
| Host disconnects | **Handled** | `hostId` reassigned to `players[0]`; new host can start next round |
| Witness disconnects mid-game | **Fixed** | Server sets `_witnessDisconnected`, `handleDisconnect` auto-ends round (`reason: 'witness-left'`), no points awarded |
| Witness disconnects and immediately reconnects | Partial | Reconnection restores the player, but the round was already ended. Round-end screen will show "Witness left". Could be improved with a grace period |
| Network flap (brief disconnect/reconnect) | **Handled** | Client auto-rejoins via `localStorage` stored `roomCode`; server restores player state |
| Server crashes and restarts | Not handled | All in-memory state is lost. Players land back on the landing screen and must create a new room. Acceptable for a party game |

---

## Timer

| Edge case | Status | Notes |
|---|---|---|
| Timer set to 0 or negative value | **Fixed** | `clampedTimer` enforces 30s–600s range; falls back to default |
| Timer set to >10 minutes | **Fixed** | Clamped to 600s max |
| Timer started twice (double-tap) | **Fixed** | `startTimerTick` calls `clearTimerInterval` before creating a new interval |
| Timer action sent with invalid `action` string | **Fixed** | Server validates `['start','pause','reset'].includes(action)` |
| Timer still ticking after round ends | **Fixed** | `endRound` calls `clearTimerInterval`; `tickTimer` checks `!room.timer.running` |
| `timer-action` sent from a lawyer (not witness) | **Fixed** | Server checks `caller.role !== 'witness'` |
| Timer reaches negative values | **Fixed** | `tickTimer` only decrements if `remainingSec > 0` |

---

## Game Flow

| Edge case | Status | Notes |
|---|---|---|
| Host clicks Start twice (double-tap) | **Fixed** | `startGame` guards `phase !== 'waiting'` |
| `next-round` called while game is still playing | **Fixed** | Guards `phase !== 'round-end'` |
| `next-round` called by non-host | **Fixed** | Server checks `caller.id !== room.hostId` |
| Witness is the only player left after others disconnect | Partial | Witness can still rotate lawyers (no-op), end round, and advance. Harmless but odd |
| All lawyers disconnect during a round | Not handled | Witness is stuck with no lawyers. Round should auto-end. Currently requires witness to manually tap "End Round Early" |
| `rotate-lawyer` with 0 lawyers | **Handled** | `rotateLawyer` returns `room` unchanged if `lawyers.length === 0` |
| `spend-token` when already at 0 tokens | **Handled** | `if (player.objectionTokens > 0)` guard in gameState |
| Scenario or target pool is empty | Not guarded | If `scenarios.json` or `targets.json` is an empty array, `startGame` will crash (`undefined` scenario). Add a check if you edit the config files |
| Targets pool smaller than lawyer count | **Handled** | `i % shuffledTargets.length` wraps around so targets repeat rather than crash |

---

## Network & Security

| Edge case | Status | Notes |
|---|---|---|
| Malformed socket payload (missing fields) | Partial | Most handlers use optional chaining or early returns on `null`. A missing `code` field on events will just silently fail rather than crash |
| Extremely long names (DoS / display overflow) | **Fixed** | Names clamped to 20 chars server-side; CSS `truncate` handles display |
| CORS misconfiguration in production | Documented | Set `CLIENT_URL` env var to your deployed URL if you see CORS errors |
| Rooms accumulating forever (memory leak) | Not fixed | Rooms are never deleted unless all players leave. A long-running server could accumulate stale rooms. **Fix:** add a room expiry (e.g. delete rooms idle for >2 hours) |
| No rate limiting on socket events | Not fixed | A bad actor could spam `create-room` or `join-room` to fill memory. Low risk for a party game but worth adding before public release |
| `playerId` stored in `localStorage` is predictable | Acceptable | UUIDs are effectively unguessable for a party game context |

---

## What to Fix Before a Public Launch

If you plan to share this beyond your friend group, the three highest-priority items
that haven't been implemented yet are:

### 1. Room expiry (memory leak prevention)
Add a stale-room cleanup in `gameState.js`:

```js
// In server/index.js or gameState.js — run every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000; // 2 hours
  for (const [code, room] of rooms) {
    if ((room.lastActivity || 0) < cutoff) {
      clearTimerInterval(room);
      rooms.delete(code);
      console.log('Expired room:', code);
    }
  }
}, 10 * 60 * 1000);
```

Update `lastActivity = Date.now()` on every state mutation.

### 2. Auto-end round when all lawyers leave
In `handleDisconnect`, after `removePlayer`, check if any lawyers remain:

```js
if (updated.phase === 'playing') {
  const lawyersLeft = updated.players.filter(p => p.role === 'lawyer').length;
  if (lawyersLeft === 0) {
    const ended = gs.endRound(room.code, 'manual', null);
    if (ended) broadcastRoom(ended);
    return;
  }
}
```

### 3. Validate config files on startup
In `server/index.js`:

```js
if (!scenarios.length) throw new Error('scenarios.json is empty');
if (!targets.length) throw new Error('targets.json is empty');
```

This surfaces misconfiguration immediately rather than crashing mid-game.

---

## Summary

| Category | Fixed | Outstanding |
|---|---|---|
| Scoring | 5/5 | 0 |
| Player count | 4/5 | 1 (player count drops to 1) |
| Disconnections | 5/6 | 1 (reconnect grace period) |
| Timer | 6/6 | 0 |
| Game flow | 6/8 | 2 (all lawyers leave, config validation) |
| Network/security | 3/6 | 3 (room expiry, rate limiting, malformed payloads) |
