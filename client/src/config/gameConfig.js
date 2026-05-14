// ─────────────────────────────────────────────────────────────────────────────
// Client-side game config
//
// Timer presets shown in the lobby must stay in sync with
// server/config/gameConfig.json  →  timer.presets
// All other balance values (token counts, scoring, player limits) live only
// on the server in that same file.
// ─────────────────────────────────────────────────────────────────────────────

export const TIMER_OPTIONS = [
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
  { label: '4 min', value: 240 },
  { label: '5 min', value: 300 },
];
