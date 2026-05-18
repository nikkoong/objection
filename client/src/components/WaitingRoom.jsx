import { useState } from 'react';
import { useGame } from '../context/GameContext';

const TIMER_PRESETS = [
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
  { label: '4 min', value: 240 },
  { label: '5 min', value: 300 },
  { label: '6 min', value: 360 },
];

export default function WaitingRoom() {
  const {
    roomCode, roomState, playerId, isHost,
    startGame, setTimerConfig, leaveRoom, error, clearError,
  } = useGame();

  // null = "Auto" (1 min per lawyer), number = manual override
  const [selectedTimer, setSelectedTimer] = useState(null);

  const players = roomState?.players || [];
  const canStart = players.length >= 2;

  // Auto-calculate: 1 min per lawyer (all players except the witness)
  const lawyerCount = Math.max(players.length - 1, 1);
  const autoTimerSec = Math.min(lawyerCount * 60, 360); // cap at 6 min
  const effectiveTimerSec = selectedTimer !== null ? selectedTimer : autoTimerSec;
  const effectiveLabel = selectedTimer !== null
    ? TIMER_PRESETS.find((p) => p.value === selectedTimer)?.label
    : `${Math.round(autoTimerSec / 60)} min`;

  function handleTimerChange(val) {
    // val = null means "back to auto"
    setSelectedTimer(val);
    // Broadcast to all players what timer is selected
    setTimerConfig(val !== null ? val : autoTimerSec);
  }

  function handleStart() {
    startGame(effectiveTimerSec);
  }

  function copyCode() {
    navigator.clipboard?.writeText(roomCode).catch(() => {});
  }

  return (
    <div className="min-h-screen flex flex-col p-6 gap-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-2xl font-black text-amber-400">OBJECTION!</div>
        <button className="btn-secondary btn-sm" onClick={leaveRoom}>Leave</button>
      </div>

      {/* Room code */}
      <div className="card flex flex-col items-center gap-3 cursor-pointer active:opacity-80" onClick={copyCode}>
        <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Room Code</p>
        <div className="text-6xl font-black tracking-[0.25em] text-amber-400 select-none">
          {roomCode}
        </div>
        <p className="text-zinc-500 text-xs">Tap to copy · Share with friends</p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="bg-red-900/50 border border-red-700 rounded-2xl px-4 py-3 text-red-300 text-sm cursor-pointer"
          onClick={clearError}
        >
          ⚠ {error}
        </div>
      )}

      {/* Player list */}
      <div className="card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-white">Players</p>
          <span className="badge bg-zinc-800 text-zinc-300">{players.length}</span>
        </div>
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-zinc-800/50 rounded-2xl px-4 py-3"
            >
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                {p.name[0].toUpperCase()}
              </div>
              <span className="font-semibold text-white">{p.name}</span>
              {p.id === roomState?.hostId && (
                <span className="badge bg-amber-400/20 text-amber-400 ml-auto text-xs">Host</span>
              )}
              {p.id === playerId && p.id !== roomState?.hostId && (
                <span className="badge bg-zinc-700 text-zinc-300 ml-auto text-xs">You</span>
              )}
              {p.id === playerId && p.id === roomState?.hostId && (
                <span className="badge bg-amber-400/20 text-amber-400 ml-1 text-xs">You</span>
              )}
            </div>
          ))}
        </div>
        {!canStart && (
          <p className="text-zinc-500 text-sm text-center mt-1">
            Need at least 2 players to start
          </p>
        )}
      </div>

      {/* Timer config (host only) */}
      {isHost && (
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-white">Round Timer</p>
            <span className="text-amber-400 font-bold text-sm">{effectiveLabel}</span>
          </div>

          {/* Auto option */}
          <button
            className={`rounded-xl py-3 text-sm font-bold transition-all active:scale-95 w-full ${
              selectedTimer === null
                ? 'bg-amber-400 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300'
            }`}
            onClick={() => handleTimerChange(null)}
          >
            Auto — {Math.round(autoTimerSec / 60)} min
            <span className="font-normal ml-1 opacity-70">(1 min × {lawyerCount} lawyer{lawyerCount !== 1 ? 's' : ''})</span>
          </button>

          {/* Manual presets */}
          <div className="grid grid-cols-3 gap-2">
            {TIMER_PRESETS.map((opt) => (
              <button
                key={opt.value}
                className={`rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${
                  selectedTimer === opt.value
                    ? 'bg-amber-400 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
                onClick={() => handleTimerChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isHost && (
        <div className="card text-center">
          <p className="text-zinc-400">Waiting for the host to start…</p>
          <div className="flex justify-center gap-1 mt-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-amber-400"
                style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Start button */}
      {isHost && (
        <button
          className="btn-primary w-full"
          onClick={handleStart}
          disabled={!canStart}
        >
          Start Game — {effectiveLabel} timer
        </button>
      )}

      <div className="text-zinc-600 text-xs text-center leading-relaxed pb-4">
        Lawyers try to make the Witness trigger their secret Target.<br />
        The Witness survives the timer to win the round.
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
