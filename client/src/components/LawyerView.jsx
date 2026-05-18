import { useState } from 'react';
import { useGame } from '../context/GameContext';
import Scoreboard from './Scoreboard';
import ObjectionsFAQ from './ObjectionsFAQ';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function LawyerView() {
  const {
    roomState, me, playerId, isActiveLawyer,
    spendToken, revealTarget,
  } = useGame();

  const [drawer, setDrawer] = useState(null); // null | 'scores' | 'faq'
  const [revealConfirm, setRevealConfirm] = useState(false);

  if (!roomState || !me) return null;

  const { players, scenario, timer, activeLawyerIndex } = roomState;
  const lawyers = players.filter((p) => p.role === 'lawyer');
  const myTarget = roomState.myTarget;
  const pendingObjection = roomState.pendingObjection;
  const iAmObjector = pendingObjection?.lawyerId === playerId;

  const { remainingSec, durationSec, running } = timer;
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const pct = durationSec > 0 ? (remainingSec / durationSec) * 100 : 0;
  const isLow = remainingSec <= 30 && remainingSec > 0;
  const isOut = remainingSec <= 0;

  const canObject = me.objectionTokens > 0 && !isActiveLawyer && !pendingObjection && !isOut;
  const objectionBlockReason = isOut ? 'Round over'
    : isActiveLawyer ? "Can't object on your own turn"
    : pendingObjection ? (iAmObjector ? 'Waiting for witness to rule…' : `${pendingObjection.lawyerName} is objecting…`)
    : me.objectionTokens <= 0 ? 'No tokens left'
    : null;

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto overflow-hidden">

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
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Your Tokens</p>
                  <div className="flex gap-2">
                    {Array.from({ length: Math.max(me.objectionTokens, 0) }).map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black">!</div>
                    ))}
                    {me.objectionTokens === 0 && <span className="text-zinc-500 text-sm">No tokens left</span>}
                  </div>
                </div>
              </>
            )}
            {drawer === 'faq' && <ObjectionsFAQ />}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-3 min-h-0">

        {/* Top bar */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-amber-400">OBJECTION!</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              isActiveLawyer ? 'bg-amber-400/20 text-amber-400' : 'bg-zinc-700 text-zinc-400'
            }`}>
              {isActiveLawyer ? 'Your Turn' : 'Lawyer'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Round {roomState.round}</span>
            <button className="text-zinc-400 text-sm px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700" onClick={() => setDrawer('scores')}>Scores</button>
            <button className="text-zinc-400 text-sm px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700" onClick={() => setDrawer('faq')}>?</button>
          </div>
        </div>

        {/* Scenario */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Scenario</p>
          <p className="text-white font-semibold text-sm leading-snug">{scenario}</p>
        </div>

        {/* Secret target — prominent */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-amber-400/40 rounded-2xl px-4 py-3 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/70 mb-1">Your Secret Target</p>
          <p className="text-white font-black text-xl leading-snug">{myTarget}</p>
          <p className="text-zinc-500 text-xs mt-1.5">Get the witness to trigger this during your question. Keep it secret.</p>
        </div>

        {/* Who's questioning — compact strip */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Questioning</p>
            {/* Timer inline */}
            <div className="flex items-center gap-2">
              <span className={`text-base font-black tabular-nums ${isOut ? 'text-zinc-500' : isLow ? 'text-red-400' : 'text-zinc-300'} ${isLow && running ? 'animate-pulse' : ''}`}>
                {pad(mins)}:{pad(secs)}
              </span>
              <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${isOut ? 'bg-zinc-700' : isLow ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-zinc-600 text-xs">{running ? '▶' : isOut ? '—' : '⏸'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lawyers.map((lawyer) => {
              const isActive = players.findIndex(p => p.id === lawyer.id) === activeLawyerIndex;
              const isMe = lawyer.id === playerId;
              return (
                <div
                  key={lawyer.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-400/15 border-amber-400 text-amber-400'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 opacity-60'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-400' : 'bg-zinc-600'}`} />
                  {lawyer.name}{isMe ? ' (You)' : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* OBJECTION! button — the main action */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <button
            className={`w-full font-black text-2xl rounded-2xl transition-all active:scale-95 flex-1 ${
              canObject
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
            disabled={!canObject}
            onClick={spendToken}
          >
            OBJECTION!
            <div className="text-sm font-normal mt-1 opacity-70">
              {objectionBlockReason || `${me.objectionTokens} token${me.objectionTokens !== 1 ? 's' : ''} remaining`}
            </div>
          </button>

          {/* Reveal target — only shown to active lawyer */}
          {isActiveLawyer && (
            <div className="bg-zinc-900 border border-emerald-800 rounded-2xl p-3">
              {!revealConfirm ? (
                <button
                  className="w-full bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-black text-base py-3 rounded-xl transition-all"
                  onClick={() => setRevealConfirm(true)}
                >
                  Reveal Target — I Win!
                  <div className="text-xs font-normal mt-0.5 opacity-70">Tap if witness triggered your target</div>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-white font-semibold text-sm text-center">Confirm reveal?</p>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-emerald-700 active:scale-95 text-white font-bold py-3 rounded-xl transition-all" onClick={revealTarget}>
                      Yes, Reveal!
                    </button>
                    <button className="flex-1 bg-zinc-700 active:scale-95 text-zinc-300 font-bold py-3 rounded-xl transition-all" onClick={() => setRevealConfirm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
