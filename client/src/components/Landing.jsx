import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function Landing() {
  const { createRoom, joinRoom, error, clearError, connected } = useGame();
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [nameError, setNameError] = useState('');
  const [codeError, setCodeError] = useState('');

  function handleCreate() {
    if (!name.trim()) { setNameError('Enter your name'); return; }
    setNameError('');
    createRoom(name.trim());
  }

  function handleJoin() {
    if (!name.trim()) { setNameError('Enter your name'); return; }
    if (code.trim().length !== 4) { setCodeError('Room code is 4 characters'); return; }
    setNameError('');
    setCodeError('');
    joinRoom(code.trim().toUpperCase(), name.trim());
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      {/* Header */}
      <div className="text-center no-select">
        <div className="text-6xl font-black tracking-tight text-amber-400 leading-none">
          OBJECTION!
        </div>
        <div className="mt-2 text-zinc-400 text-base">
          Fast-paced courtroom improv
        </div>
      </div>

      {/* Connection status */}
      {!connected && (
        <div className="text-zinc-500 text-sm animate-pulse">Connecting…</div>
      )}

      {/* Error banner */}
      {error && (
        <div
          className="w-full max-w-sm bg-red-900/50 border border-red-700 rounded-2xl px-4 py-3 text-red-300 text-sm flex items-start gap-3"
          onClick={clearError}
        >
          <span className="mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {mode === null && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button className="btn-primary w-full" onClick={() => setMode('create')}>
            Create Room
          </button>
          <button className="btn-secondary w-full" onClick={() => setMode('join')}>
            Join Room
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="card w-full max-w-sm flex flex-col gap-5">
          <div>
            <label className="label">Your Name</label>
            <input
              className="input"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              maxLength={20}
              autoFocus
            />
            {nameError && <p className="text-red-400 text-sm mt-1">{nameError}</p>}
          </div>
          <button className="btn-primary w-full" onClick={handleCreate} disabled={!connected}>
            Create Room
          </button>
          <button className="btn-secondary w-full btn-sm" onClick={() => setMode(null)}>
            Back
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="card w-full max-w-sm flex flex-col gap-5">
          <div>
            <label className="label">Your Name</label>
            <input
              className="input"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            {nameError && <p className="text-red-400 text-sm mt-1">{nameError}</p>}
          </div>
          <div>
            <label className="label">Room Code</label>
            <input
              className="input uppercase tracking-[0.3em] text-center text-2xl font-bold"
              placeholder="X4P1"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={4}
            />
            {codeError && <p className="text-red-400 text-sm mt-1">{codeError}</p>}
          </div>
          <button className="btn-primary w-full" onClick={handleJoin} disabled={!connected}>
            Join Room
          </button>
          <button className="btn-secondary w-full btn-sm" onClick={() => setMode(null)}>
            Back
          </button>
        </div>
      )}

      {/* How to play blurb */}
      {mode === null && (
        <p className="text-zinc-600 text-xs text-center max-w-xs leading-relaxed">
          3–12 players · No accounts needed · Play in person on your phones
        </p>
      )}
    </div>
  );
}
