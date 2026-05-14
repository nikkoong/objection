export default function Timer({ timer, isWitness, onTimerAction }) {
  const { remainingSec, durationSec, running } = timer;

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

  const pct = durationSec > 0 ? (remainingSec / durationSec) * 100 : 0;
  const isLow = remainingSec <= 30;
  const isOut = remainingSec <= 0;

  const barColor = isOut
    ? 'bg-zinc-700'
    : isLow
    ? 'bg-red-500'
    : 'bg-amber-400';

  return (
    <div className="flex flex-col gap-3">
      {/* Time display */}
      <div className={`text-center font-black tabular-nums leading-none ${
        isOut ? 'text-zinc-500 text-5xl' : isLow ? 'text-red-400 text-5xl' : 'text-white text-5xl'
      } ${isLow && running ? 'animate-pulse' : ''}`}>
        {timeStr}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Controls (witness only) */}
      {isWitness && (
        <div className="flex gap-3 justify-center">
          {!running && !isOut && (
            <button
              className="btn-primary flex-1"
              onClick={() => onTimerAction('start')}
            >
              {remainingSec === durationSec ? 'Start Timer' : 'Resume'}
            </button>
          )}
          {running && (
            <button
              className="btn-secondary flex-1"
              onClick={() => onTimerAction('pause')}
            >
              Pause
            </button>
          )}
          <button
            className="btn-secondary"
            onClick={() => onTimerAction('reset')}
            title="Reset timer"
          >
            ↺
          </button>
        </div>
      )}

      {!isWitness && (
        <p className="text-zinc-500 text-xs text-center">
          {running ? 'Timer running' : isOut ? 'Time\'s up!' : 'Timer paused'}
        </p>
      )}
    </div>
  );
}
