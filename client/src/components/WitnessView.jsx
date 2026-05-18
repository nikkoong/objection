import { useGame } from '../context/GameContext';
import { useState } from 'react';
import Scoreboard from './Scoreboard';
import ObjectionsFAQ from './ObjectionsFAQ';

function pad(n) {
  return String(n).padStart(2, '0');
}

function TimerDisplay({ timer }) {
  const { remainingSec, durationSec, running } = timer;
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const pct = durationSec > 0 ? (remainingSec / durationSec) * 100 : 0;
  const isLow = remainingSec <= 30 && remainingSec > 0;
  const isOut = remainingSec <= 0;
  return (
    <div className="flex flex-col gap-1">
      <div className={`text-4xl font-black tabular-nums text-center leading-none ${
        isOut ? 'text-zinc-500' : isLow ? 'text-red-400' : 'text-white'
      } ${isLow && running ? 'animate-pulse' : ''}`}>
        {pad(mins)}:{pad(secs)}
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isOut ? 'bg-zinc-700' : isLow ? 'bg-red-500' : 'bg-amber-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function WitnessView() {
  const {
    roomState, me, activeLawyer, playerId,
    timerAction, rotateLawyer, endRound,
    sustainObjection, dismissObjection,
  } = useGame();

  const [drawer, setDrawer] = useState(null); // null | 'scores' | 'faq'

  if (!roomState || !me) return null;

  const { players, scenario, timer, activeLawyerIndex, pendingObjection, witnessCharacter } = roomState;
  const lawyers = players.filter((p) => p.role === 'lawyer');
  const timedOut = timer.remainingSec <= 0;
  const canRotate = !timedOut && !pendingObjection;

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto overflow-hidden">

      {/* ── Pending objection overlay ── */}
      {pendingObjection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5">
          <div className="bg-zinc-900 border-2 border-amber-400 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <p className="text-amber-400 font-black text-3xl text-center tracking-wide mb-1">
              OBJECTION!
            </p>
            <p className="text-zinc-300 text-center text-sm mb-1">
              raised by <span className="text-white font-bold">{pendingObjection.lawyerName}</span>
            </p>
            <p className="text-zinc-500 text-xs text-center mb-5">Timer paused — rule now</p>
            <div className="flex gap-3 mb-4">
              <button
                className="flex-1 bg-emerald-600 active:scale-95 text-white font-black text-xl py-5 rounded-2xl transition-all"
                onClick={sustainObjection}
              >
                Sustained
              </button>
              <button
                className="flex-1 bg-red-700 active:scale-95 text-white font-black text-xl py-5 rounded-2xl transition-all"
                onClick={dismissObjection}
              >
                Dismissed
              </button>
            </div>
            <div className="flex gap-2 text-xs text-zinc-500 text-center">
              <p className="flex-1">Sustained → turn rotates to next lawyer</p>
              <div className="w-px bg-zinc-700 self-stretch" />
              <p className="flex-1">Dismissed → objector loses another token</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer overlay ── */}
      {drawer && (
        <div className="fixed inset-0 z-40 bg-black/70 flex flex-col justify-end" onClick={() => setDrawer(null)}>
          <div
            className="bg-zinc-900 border-t border-zinc-700 rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-white">
                {drawer === 'scores' ? 'Scoreboard' : 'Objections Reference'}
              </span>
              <button className="text-zinc-400 text-2xl leading-none" onClick={() => setDrawer(null)}>×</button>
            </div>
            {drawer === 'scores' && (
              <>
                <Scoreboard players={players} highlightId={playerId} />
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Lawyer Tokens</p>
                  <div className="flex flex-col gap-2">
                    {lawyers.map((lawyer) => {
                      const isActive = players.findIndex(p => p.id === lawyer.id) === activeLawyerIndex;
                      const isObjector = pendingObjection?.lawyerId === lawyer.id;
                      return (
                        <div key={lawyer.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                          isObjector ? 'bg-amber-900/30 border border-amber-700'
                          : isActive ? 'bg-amber-400/10' : 'bg-zinc-800/50'
                        }`}>
                          <span className={`font-semibold text-sm flex-1 ${
                            isObjector ? 'text-amber-300' : isActive ? 'text-amber-400' : 'text-zinc-300'
                          }`}>
                            {lawyer.name}
                            {isObjector && <span className="ml-2 text-xs font-normal text-amber-500">objecting</span>}
                          </span>
                          <div className="flex gap-1 items-center">
                            {Array.from({ length: Math.max(lawyer.objectionTokens, 0) }).map((_, i) => (
                              <div key={i} className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs">!</div>
                            ))}
                            {lawyer.objectionTokens === 0 && <span className="text-zinc-600 text-xs">out</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            {drawer === 'faq' && <ObjectionsFAQ />}
          </div>
        </div>
      )}

      {/* ── Main content: fixed layout, no scroll ── */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-3 min-h-0">

        {/* Top bar */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-amber-400">OBJECTION!</span>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">Witness</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Round {roomState.round}</span>
            <button className="text-zinc-400 text-sm px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700" onClick={() => setDrawer('scores')}>Scores</button>
            <button className="text-zinc-400 text-sm px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700" onClick={() => setDrawer('faq')}>?</button>
          </div>
        </div>

        {/* Scenario */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Scenario — read aloud</p>
          <p className="text-white font-semibold text-sm leading-snug">{scenario}</p>
        </div>

        {/* Witness character */}
        {witnessCharacter && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-2.5 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">Your Character</p>
            <p className="text-zinc-400 text-xs leading-relaxed italic">{witnessCharacter}</p>
          </div>
        )}

        {/* Timer */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <TimerDisplay timer={timer} />
            </div>
            <div className="flex gap-2 shrink-0">
              {!timer.running && !timedOut && (
                <button
                  className="bg-amber-400 text-zinc-950 font-bold text-sm px-4 py-2 rounded-xl active:scale-95 transition-all"
                  onClick={() => timerAction('start')}
                  disabled={!!pendingObjection}
                >
                  {timer.remainingSec === timer.durationSec ? 'Start' : 'Resume'}
                </button>
              )}
              {timer.running && (
                <button
                  className="bg-zinc-700 text-white font-bold text-sm px-4 py-2 rounded-xl active:scale-95 transition-all"
                  onClick={() => timerAction('pause')}
                >
                  Pause
                </button>
              )}
              <button
                className="bg-zinc-800 text-zinc-400 font-bold text-sm px-3 py-2 rounded-xl active:scale-95 transition-all"
                onClick={() => timerAction('reset')}
                title="Reset"
              >
                ↺
              </button>
            </div>
          </div>
          {pendingObjection && (
            <p className="text-amber-500 text-xs text-center mt-2">Paused — objection pending</p>
          )}
          {timedOut && (
            <p className="text-blue-400 text-xs font-semibold text-center mt-2">Time's up — you earned +2 points!</p>
          )}
        </div>

        {/* Primary controller: active lawyer + Next Lawyer */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-amber-400/50 rounded-2xl p-4 flex-1 flex flex-col justify-between min-h-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-black text-lg shrink-0">
              {activeLawyer?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-amber-400/70 uppercase tracking-wider font-semibold">Now questioning</p>
              <p className="text-amber-400 font-black text-xl leading-tight truncate">{activeLawyer?.name}</p>
            </div>
            <div className="ml-auto flex gap-1 shrink-0">
              {Array.from({ length: Math.max(activeLawyer?.objectionTokens ?? 0, 0) }).map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs">!</div>
              ))}
              {(activeLawyer?.objectionTokens ?? 0) === 0 && (
                <span className="text-zinc-600 text-xs self-center">no tokens</span>
              )}
            </div>
          </div>
          <button
            className={`w-full font-black text-lg py-4 rounded-2xl transition-all active:scale-95 ${
              canRotate
                ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
            onClick={rotateLawyer}
            disabled={!canRotate}
          >
            Next Lawyer →
          </button>
          <p className="text-zinc-500 text-xs text-center mt-2">
            {timedOut ? 'Round over' : pendingObjection ? 'Resolve the objection first' : 'Tap after the witness answers'}
          </p>
        </div>

        {/* End round — secondary, de-emphasized */}
        <button
          className="w-full bg-zinc-900 border border-zinc-700 text-zinc-400 font-semibold text-sm py-3 rounded-2xl active:scale-95 transition-all disabled:opacity-40 shrink-0"
          onClick={() => endRound('manual')}
          disabled={!!pendingObjection}
        >
          End Round Early — No Points
        </button>

      </div>
    </div>
  );
}
