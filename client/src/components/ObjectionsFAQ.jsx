import { useState } from 'react';

const OBJECTIONS = [
  {
    name: 'LEADING',
    tagline: 'You suggested the answer.',
    example: '"So your favorite food is pizza, right?"',
    color: 'text-amber-400',
  },
  {
    name: 'RELEVANCE',
    tagline: 'That has nothing to do with the case.',
    example:
      'Witness is accused of tax fraud and Lawyer asks: "What kinds of pets do you own?"',
    color: 'text-amber-400',
  },
  {
    name: 'VAGUE',
    tagline: 'That question is unclear.',
    example: '"What happened that day?"',
    color: 'text-amber-400',
  },
  {
    name: 'SPECULATION',
    tagline: "You're asking the witness to guess.",
    example: '"What do you think your neighbor was planning to do?"',
    color: 'text-amber-400',
  },
  {
    name: 'COMPOUND',
    tagline: 'That was multiple questions.',
    example: '"Where were you, who were you with, and why were you carrying a shovel?"',
    color: 'text-amber-400',
  },
];

export default function ObjectionsFAQ() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <button
        className="btn-secondary btn-sm w-full text-center"
        onClick={() => setOpen(true)}
      >
        The 5 Objections
      </button>

      {/* Modal / drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">The 5 Objections</h2>
              <button
                className="text-zinc-500 text-2xl leading-none"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            {/* Ruling reminder */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-300 leading-relaxed">
              <p>
                Any lawyer may spend 1 token and yell{' '}
                <strong className="text-amber-400">"OBJECTION!"</strong> before the Witness
                answers. The Witness rules immediately:
              </p>
              <div className="flex gap-3 mt-3">
                <div className="flex-1 bg-emerald-900/30 border border-emerald-800 rounded-xl p-3 text-center">
                  <div className="font-black text-emerald-400">SUSTAINED</div>
                  <div className="text-xs text-zinc-400 mt-1">Turn ends, next lawyer questions</div>
                </div>
                <div className="flex-1 bg-red-900/30 border border-red-800 rounded-xl p-3 text-center">
                  <div className="font-black text-red-400">DISMISSED</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Objector loses another token, Witness answers
                  </div>
                </div>
              </div>
            </div>

            {OBJECTIONS.map((obj) => (
              <div key={obj.name} className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-4">
                <div className={`font-black text-lg ${obj.color}`}>{obj.name}</div>
                <div className="text-white font-semibold mt-1">{obj.tagline}</div>
                <div className="text-zinc-400 text-sm mt-2 italic">{obj.example}</div>
              </div>
            ))}

            <button className="btn-secondary w-full mt-2" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
