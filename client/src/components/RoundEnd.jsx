import { useGame } from '../context/GameContext';
import Scoreboard from './Scoreboard';

export default function RoundEnd() {
  const { roomState, playerId, isHost, isWitness, nextRound, leaveRoom } = useGame();

  if (!roomState) return null;

  const { players, roundResult, allTargets, round } = roomState;
  const { reason, winnerLawyerId } = roundResult || {};

  const winnerLawyer = winnerLawyerId ? players.find((p) => p.id === winnerLawyerId) : null;
  const witness = players.find((p) => p.role === 'witness');

  const isLawyerWin = reason === 'lawyer-win';
  const isTimerWin = reason === 'timer';
  const isWitnessLeft = reason === 'witness-left';

  // Who controls "Next Round":
  // - The witness who just played (they're becoming a lawyer next round)
  // - If the witness left, fall back to the host
  const witnessStillPresent = !!witness;
  const canAdvance = isWitness || (!witnessStillPresent && isHost);
  const waitingFor = witnessStillPresent
    ? `Waiting for ${witness.name} to start next round…`
    : 'Waiting for host to start next round…';

  // Next witness preview
  const nextWitnessIdx = players.length > 0
    ? ((roomState.witnessIndex ?? 0) + 1) % players.length
    : 0;
  const nextWitness = players[nextWitnessIdx];

  return (
    <div className="min-h-screen flex flex-col p-4 gap-5 max-w-lg mx-auto pb-8">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xl font-black text-amber-400">OBJECTION!</div>
        <span className="badge bg-zinc-800 text-zinc-300 text-xs">Round {round} ended</span>
      </div>

      {/* Round result banner */}
      <div className={`rounded-3xl p-6 text-center border-2 ${
        isLawyerWin
          ? 'bg-emerald-900/20 border-emerald-500'
          : isTimerWin
          ? 'bg-blue-900/20 border-blue-500'
          : isWitnessLeft
          ? 'bg-red-900/20 border-red-700'
          : 'bg-zinc-800/50 border-zinc-700'
      }`}>
        <div className="text-5xl mb-2">
          {isLawyerWin ? '⚖️' : isTimerWin ? '🛡️' : isWitnessLeft ? '🚪' : '🔔'}
        </div>
        <div className={`text-2xl font-black ${
          isLawyerWin ? 'text-emerald-400'
          : isTimerWin ? 'text-blue-400'
          : isWitnessLeft ? 'text-red-400'
          : 'text-zinc-300'
        }`}>
          {isLawyerWin
            ? `${winnerLawyer?.name || 'A Lawyer'} wins!`
            : isTimerWin
            ? `${witness?.name || 'Witness'} survives!`
            : isWitnessLeft
            ? 'Witness left the game'
            : 'Round ended'}
        </div>
        <div className="text-zinc-400 text-sm mt-2">
          {isLawyerWin
            ? `${winnerLawyer?.name} +1 pt · ${witness?.name} +1 pt`
            : isTimerWin
            ? `${witness?.name} +2 pts`
            : 'No points awarded'}
        </div>
      </div>

      {/* Revealed targets */}
      {allTargets && Object.keys(allTargets).length > 0 && (
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            All Secret Targets Revealed
          </p>
          <div className="flex flex-col gap-2">
            {players
              .filter((p) => p.role === 'lawyer')
              .map((p) => (
                <div
                  key={p.id}
                  className={`flex flex-col gap-1 rounded-2xl px-4 py-3 ${
                    p.id === winnerLawyerId
                      ? 'bg-emerald-900/20 border border-emerald-700'
                      : 'bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{p.name}</span>
                    {p.id === winnerLawyerId && (
                      <span className="badge bg-emerald-500/20 text-emerald-400 text-xs">Winner</span>
                    )}
                    {p.id === playerId && (
                      <span className="badge bg-zinc-700 text-zinc-300 text-xs">You</span>
                    )}
                  </div>
                  <span className="text-zinc-400 text-sm italic">"{allTargets[p.id]}"</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Scoreboard */}
      <div className="card">
        <p className="font-bold text-white mb-3">Scoreboard</p>
        <Scoreboard players={players} highlightId={playerId} />
      </div>

      {/* Next round info */}
      {nextWitness && (
        <div className="card bg-zinc-900/50 text-center">
          <p className="text-zinc-400 text-sm">Next round:</p>
          <p className="text-white font-bold mt-1">
            <span className="text-amber-400">{nextWitness.name}</span> becomes the Witness
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {canAdvance ? (
          <button className="btn-primary w-full text-xl py-5" onClick={nextRound}>
            Next Round →
          </button>
        ) : (
          <div className="card text-center py-4">
            <p className="text-zinc-400">{waitingFor}</p>
          </div>
        )}
        <button className="btn-secondary w-full" onClick={leaveRoom}>
          Leave Game
        </button>
      </div>
    </div>
  );
}
