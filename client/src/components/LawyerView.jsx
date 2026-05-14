import { useState } from 'react';
import { useGame } from '../context/GameContext';
import Timer from './Timer';
import ObjectionsFAQ from './ObjectionsFAQ';
import Scoreboard from './Scoreboard';

export default function LawyerView() {
  const {
    roomState, me, activeLawyer, witness, playerId, isActiveLawyer,
    spendToken, revealTarget, timerAction,
  } = useGame();

  const [showScores, setShowScores] = useState(false);
  const [revealConfirm, setRevealConfirm] = useState(false);

  if (!roomState || !me) return null;

  const { players, scenario, timer, activeLawyerIndex } = roomState;
  const lawyers = players.filter((p) => p.role === 'lawyer');
  const myTarget = roomState.myTarget;
  const pendingObjection = roomState.pendingObjection;
  const iAmObjector = pendingObjection?.lawyerId === playerId;

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4 max-w-lg mx-auto pb-8">

      {/* Top bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xl font-black text-amber-400">OBJECTION!</div>
        <div className="flex gap-2">
          <button
            className="btn-secondary btn-sm"
            onClick={() => setShowScores(!showScores)}
          >
            Scores
          </button>
          <span className="badge bg-zinc-800 text-zinc-300 text-xs">
            Round {roomState.round}
          </span>
        </div>
      </div>

      {/* Scores overlay */}
      {showScores && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-white">Scoreboard</span>
            <button className="text-zinc-500" onClick={() => setShowScores(false)}>×</button>
          </div>
          <Scoreboard players={players} highlightId={playerId} />
        </div>
      )}

      {/* Scenario card */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Scenario
        </p>
        <p className="text-white font-semibold text-base leading-snug">{scenario}</p>
      </div>

      {/* Pending objection banner */}
      {pendingObjection && (
        <div className={`rounded-2xl border px-4 py-3 text-sm text-center font-semibold ${
          iAmObjector
            ? 'bg-amber-900/20 border-amber-700 text-amber-300'
            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
        }`}>
          {iAmObjector
            ? 'Your objection is pending — waiting for the Witness to rule…'
            : `Objection from ${pendingObjection.lawyerName} — waiting for Witness to rule…`}
        </div>
      )}

      {/* Active lawyer indicator */}
      <div className="card">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Currently Questioning
        </p>
        <div className="flex flex-wrap gap-2">
          {lawyers.map((lawyer) => {
            const isActive = players.findIndex(p => p.id === lawyer.id) === activeLawyerIndex;
            return (
              <div
                key={lawyer.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-amber-400/15 border-amber-400 pulse-glow'
                    : 'bg-zinc-800/50 border-zinc-700 opacity-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-400' : 'bg-zinc-600'}`} />
                <span className={`font-semibold text-sm ${isActive ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {lawyer.name}
                  {lawyer.id === playerId ? ' (You)' : ''}
                </span>
              </div>
            );
          })}
        </div>
        {isActiveLawyer && (
          <div className="mt-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-4 py-3 text-amber-300 text-sm font-semibold text-center">
            It's your turn to question!
          </div>
        )}
      </div>

      {/* My secret target */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-amber-400/30 rounded-3xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/70 mb-2">
          Your Secret Target
        </p>
        <p className="text-white font-bold text-xl leading-snug">{myTarget}</p>
        <p className="text-zinc-500 text-xs mt-3 leading-relaxed">
          Guide the Witness to trigger this <strong className="text-zinc-400">during your question</strong>.
          Keep it secret!
        </p>
      </div>

      {/* Timer (read-only for lawyers) */}
      <div className="card">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Timer
        </p>
        <Timer timer={timer} isWitness={false} onTimerAction={timerAction} />
      </div>

      {/* Objection tokens */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Your Objection Tokens
          </p>
          <div className="flex gap-2 mt-2">
            {Array.from({ length: Math.max(me.objectionTokens, 0) }).map((_, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-lg"
              >
                !
              </div>
            ))}
            {me.objectionTokens === 0 && (
              <span className="text-zinc-600 text-sm font-semibold">No tokens left</span>
            )}
          </div>
        </div>
        <button
          className="btn-danger btn-sm"
          disabled={me.objectionTokens <= 0 || isActiveLawyer || !!pendingObjection}
          onClick={spendToken}
        >
          OBJECTION!
        </button>
      </div>

      {/* Witness info */}
      {witness && (
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black">
            W
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Witness</p>
            <p className="text-white font-semibold">{witness.name}</p>
          </div>
        </div>
      )}

      {/* Reveal Target button (only active lawyer) */}
      {isActiveLawyer && (
        <div className="card border-emerald-800 bg-emerald-900/10">
          <p className="text-sm text-zinc-300 mb-3">
            Did the Witness just trigger your target?
          </p>
          {!revealConfirm ? (
            <button
              className="btn-success w-full"
              onClick={() => setRevealConfirm(true)}
            >
              Reveal My Target — I Win!
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-white font-semibold text-center">Are you sure?</p>
              <div className="flex gap-3">
                <button className="btn-success flex-1" onClick={revealTarget}>
                  Yes, Reveal!
                </button>
                <button className="btn-secondary flex-1" onClick={() => setRevealConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Objections FAQ */}
      <ObjectionsFAQ />
    </div>
  );
}
