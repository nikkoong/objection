# OBJECTION! — Multiplayer Web Game

Fast-paced courtroom improv party game. No accounts, no downloads — just open a link on your phone.

**OBJECTION!** is a party game where lawyers try to secretly manipulate a witness into saying or doing something, while other lawyers can interrupt with **OBJECTIONS**.

---

## THE IDEA

- One player is the **Witness**, put on the stand in an absurd courtroom scenario.
- Everyone else is a **Lawyer**, each holding a secret Target card.
- Lawyers question the Witness one at a time, clockwise.
- Any lawyer can spend an **Objection Token** at any moment to yell **"OBJECTION!"**
- The Witness decides: **Sustained** (turn rotates) or **Dismissed** (objector loses another token).
- First lawyer whose target gets triggered wins the round. If the Witness survives the timer — the Witness wins.

---

## QUICK START (local)

```bash
npm install
npm run dev
```

- Server: `http://localhost:3001`
- Client: `http://localhost:5173`

On mobile: use your machine's local IP, e.g. `http://192.168.1.X:5173`

---

## DEPLOY TO RENDER (recommended)

1. Push this repo to GitHub.
2. Create a new **Web Service** on [Render](https://render.com), connect the repo.
3. Render will auto-detect `render.yaml` and use:
   - **Build:** `npm install --include=dev && npm run build`
   - **Start:** `npm start`
   - **Env:** `NODE_ENV=production`
4. Your game is live. Share the URL with players.

> The free tier spins down after inactivity — the first player to open the link may wait ~30s for a cold start.

See [`HOSTING.md`](./HOSTING.md) for Railway, Fly.io, and self-hosted alternatives.

---

## HOW TO PLAY

### Setup
- Minimum 3 players (recommended 4–8).
- One player creates a room, shares the 6-letter code.
- Host picks the round timer (2 min for small groups, 4 min for larger).
- Host starts the game — roles are assigned automatically.

### Roles
| Role | Count | Job |
|------|-------|-----|
| Witness | 1 | Answer questions; survive the timer |
| Lawyer | Everyone else | Make the Witness trigger your secret Target |

### Round flow
1. Witness reads the Scenario aloud.
2. Witness starts the timer.
3. Lawyers ask questions **one at a time**, clockwise.
4. **At any point** before the Witness answers, a lawyer can spend a token and call **OBJECTION!** — they must name the type immediately.
5. Witness rules: **Sustained** → turn rotates. **Dismissed** → objector loses another token.
6. If a Lawyer's target gets triggered → reveal it. Lawyer +1, Witness +1. Round ends.
7. If the timer runs out → Witness +2. Round ends.
8. Witness controls "Next Round" at the round-end screen. Witness role rotates clockwise.

### The five objections
| Type | Reason |
|------|--------|
| **Leading** | You suggested the answer |
| **Relevance** | Nothing to do with the case |
| **Vague** | Question is unclear |
| **Speculation** | Asking the witness to guess |
| **Compound** | Multiple questions at once |

### Scoring
| Event | Points |
|-------|--------|
| Lawyer reveals target | Lawyer +1, Witness +1 |
| Witness survives timer | Witness +2 |
| Objection dismissed | Objector loses 1 extra token |

Play to 5, 10, or whenever you want to stop.

---

## CUSTOMIZING CONTENT

All cards live in `server/config/`. No code changes needed — just edit JSON and restart.

| File | Contains |
|------|----------|
| `scenarios.json` | Courtroom scenario strings (array) |
| `targets.json` | Secret target card strings (array) |

All balance values (token counts, timer bounds, scoring, player limits) are in `server/config/gameConfig.json`.

---

## PROJECT STRUCTURE

```
objection/
├── server/
│   ├── index.js              # Express + Socket.io, all event handlers
│   ├── gameState.js          # In-memory room state, all game logic
│   └── config/
│       ├── gameConfig.json   # Token counts, scoring, timer, player limits
│       ├── scenarios.json    # Scenario cards
│       └── targets.json      # Target cards
├── client/
│   └── src/
│       ├── App.jsx           # Phase-based router
│       ├── context/
│       │   └── GameContext.jsx  # All socket state & actions
│       └── components/
│           ├── Landing.jsx
│           ├── WaitingRoom.jsx
│           ├── WitnessView.jsx
│           ├── LawyerView.jsx
│           ├── RoundEnd.jsx
│           └── ObjectionsFAQ.jsx
├── render.yaml               # Render deploy config
├── HOSTING.md                # Hosting options comparison
└── EDGE_CASES.md             # Production edge case audit
```

---

## PRODUCTION BUILD (manual)

```bash
npm run build   # builds client → client/dist/
npm start       # serves everything on PORT (default 3001)
```
