import { useGame } from '../context/GameContext';
import Timer from './Timer';
import ObjectionsFAQ from './ObjectionsFAQ';
import Scoreboard from './Scoreboard';
import { useState } from 'react';

export default function WitnessView() {
  const {
    roomState, me, activeLawyer, playerId,
    timerAction, rotateLawyer, endRound,
    sustainObjection, dismissObjection,
  } = useGame();

  const [showScores, setShowScores] = useState(false);

  if (!roomState || !me) return null;

  const { players, scenario, timer, activeLawyerIndex, pendingObjection } = roomState;
  const lawyers = players.filter((p) => p.role === 'lawyer');
  const timedOut = timer.remainingSec <= 0;

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4 max-w-lg mx-auto pb-8">

      {/* ── Pending objection overlay ── */}
      {pendingObjection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6">
          <div className="bg-zinc-900 border-2 border-amber-400 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <p className="text-amber-400 font-black text-3xl text-center tracking-wide mb-1">
              OBJECTION!
            </p>
            <p className="text-zinc-300 text-center text-base mb-6">
              raised by <span className="text-white font-bold">{pendingObjection.lawyerName}</span>
            </p>
            <div className="flex gap-3 mb-4">
              <button
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-lg py-4 rounded-2xl transition-all"
                onClick={sustainObjection}
              >
                Sustained
              </button>
              <button
                className="flex-1 bg-red-700 hover:bg-red-600 active:scale-95 text-white font-black text-lg py-4 rounded-2xl transition-all"
                onClick={dismissObjection}
              >
                Dismissed
              </button>
            </div>
            <div className="flex gap-2 text-xs text-zinc-500 text-center">
              <p className="flex-1">Sustained → objector's turn ends, next lawyer questions</p>
              <div className="w-px bg-zinc-700 self-stretch" />
              <p className="flex-1">Dismissed → objector loses their remaining token, answer the question</p>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="text-xl font-black text-amber-400">OBJECTION!</div>
          <span className="badge bg-blue-500/20 text-blue-400 text-xs">Witness</span>
        </div>
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
            <button className="text-zinc-500 text-xl" onClick={() => setShowScores(false)}>×</button>
          </div>
          <Scoreboard players={players} highlightId={playerId} />
        </div>
      )}

      {/* Scenario card */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Scenario — Read this aloud
        </p>
        <p className="text-white font-semibold text-base leading-snug">{scenario}</p>
      </div>

      {/* Timer */}
      <div className="card">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Timer
        </p>
        <Timer timer={timer} isWitness={true} onTimerAction={timerAction} />
        {timedOut && (
          <div className="mt-3 bg-blue-900/20 border border-blue-700 rounded-2xl px-4 py-3 text-blue-300 text-sm text-center">
            Time&apos;s up — you earned <strong>+2 points</strong> automatically!
          </div>
        )}
      </div>

      {/* Active lawyer — the BIG control */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-amber-400/40 rounded-3xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/70 mb-3">
          Currently Questioning
        </p>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-black text-2xl pulse-glow">
            {activeLawyer?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-2xl font-black text-amber-400">{activeLawyer?.name}</p>
            <p className="text-zinc-400 text-sm">
              {activeLawyer?.objectionTokens ?? 0} token{activeLawyer?.objectionTokens !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>
        <button
          className="btn-primary w-full text-xl py-5"
          onClick={rotateLawyer}
          disabled={timedOut || !!pendingObjection}
        >
          Next Lawyer →
        </button>
        <p className="text-zinc-500 text-xs text-center mt-2">
          Tap after answering to pass questioning to the next lawyer
        </p>
      </div>

      {/* All lawyers token status */}
      <div className="card">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Lawyer Tokens
        </p>
        <div className="flex flex-col gap-2">
          {lawyers.map((lawyer) => {
            const isActive = players.findIndex(p => p.id === lawyer.id) === activeLawyerIndex;
            const isObjector = pendingObjection?.lawyerId === lawyer.id;
            return (
              <div
                key={lawyer.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                  isObjector
                    ? 'bg-amber-900/30 border border-amber-700'
                    : isActive
                    ? 'bg-amber-400/10'
                    : 'bg-zinc-800/50'
                }`}
              >
                <span className={`font-semibold text-sm flex-1 ${
                  isObjector ? 'text-amber-300' : isActive ? 'text-amber-400' : 'text-zinc-300'
                }`}>
                  {lawyer.name}
                  {isObjector && <span className="ml-2 text-xs font-normal text-amber-500">objecting</span>}
                </span>
                <div className="flex gap-1 items-center">
                  {Array.from({ length: Math.max(lawyer.objectionTokens, 0) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs"
                    >
                      !
                    </div>
                  ))}
                  {lawyer.objectionTokens === 0 && (
                    <span className="text-zinc-600 text-xs">out</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoring reference */}
      <div className="card bg-zinc-900/40 border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Scoring (automatic)
        </p>
        <ul className="text-zinc-400 text-sm space-y-1">
          <li>Lawyer triggers target → <span className="text-amber-400 font-semibold">Lawyer +1, You +1</span></li>
          <li>Timer runs out → <span className="text-blue-400 font-semibold">You +2</span></li>
          <li>Manual end → <span className="text-zinc-500">No points</span></li>
        </ul>
      </div>

      {/* Manual end round */}
      <div className="card border-zinc-700">
        <button
          className="btn-danger w-full"
          onClick={() => endRound('manual')}
          disabled={!!pendingObjection}
        >
          End Round Early
        </button>
        <p className="text-zinc-600 text-xs text-center mt-2">
          No points awarded. Use only to cut a round short.
        </p>
      </div>

      {/* Objections FAQ */}
      <ObjectionsFAQ />
    </div>
  );
}
