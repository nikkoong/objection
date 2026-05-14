export default function Scoreboard({ players, highlightId }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((p, i) => (
        <div
          key={p.id}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
            p.id === highlightId
              ? 'bg-amber-400/10 border border-amber-400/40'
              : 'bg-zinc-800/50 border border-transparent'
          }`}
        >
          <span className="text-zinc-500 font-bold text-sm w-5 text-center">
            {i + 1}
          </span>
          <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
            {p.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white truncate">{p.name}</div>
            <div className="text-xs text-zinc-500 capitalize">{p.role}</div>
          </div>
          <div className="text-2xl font-black text-amber-400">{p.score}</div>
        </div>
      ))}
    </div>
  );
}
