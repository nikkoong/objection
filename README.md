# OBJECTION! — Web App

Fast-paced courtroom improv game. No accounts needed — just a room code.

## Quick Start

```bash
npm install
npm run dev
```

- Server runs on http://localhost:3001
- Client runs on http://localhost:5173

Open `http://localhost:5173` on any device on the same network.

> **On mobile:** use your machine's local IP instead of `localhost`  
> e.g. `http://192.168.1.X:5173`

## Adding Scenarios & Targets

Edit the JSON files in `server/config/`:

- `scenarios.json` — courtroom situation strings
- `targets.json` — secret target card strings

No code changes needed. Restart the server after editing.

## Production Build

```bash
npm run build   # builds client to client/dist/
npm start       # serves everything from port 3001
```

Deploy to Railway/Render/Fly.io: set `NODE_ENV=production` and `PORT`.
