# Hosting OBJECTION! for Free

This app is a Node.js server (Express + Socket.io) that also serves the built React
client as static files. It needs one persistent process and a public URL. Here are
the realistic free options.

---

## Option Comparison

| Platform | Free tier | Sleep on idle | WebSocket support | Deploy method | Verdict |
|---|---|---|---|---|---|
| **Render** | Yes — 750 hrs/mo | Yes (spins down after 15 min) | Yes | Git push | **Recommended** |
| **Railway** | $5 free credit/mo | No sleep | Yes | Git push | Good, but credit burns |
| **Fly.io** | 3 shared VMs free | No sleep | Yes | CLI (`flyctl`) | Good, steeper setup |
| **AWS EC2** | t2.micro free 12 months | No sleep | Yes | SSH + manual | Overkill, expires |
| **AWS App Runner** | No free tier | — | Limited (HTTP/2 only) | — | Not suitable |
| **Vercel / Netlify** | Yes | N/A | No persistent sockets | — | Won't work — serverless only |
| **Heroku** | Removed free tier | — | — | — | No longer free |

### Why not AWS?

AWS does have a free tier (t2.micro EC2, 12 months), but:
- It expires after 12 months then you pay ~$8–10/month
- You manage OS patching, security groups, SSH keys yourself
- No auto-deploy from Git
- Socket.io works fine but you have to configure it

For a party game played occasionally, **AWS is overkill**.

---

## Recommendation: Render (free tier)

**Why Render:**
- Genuinely free with no time expiry (750 hrs/month = always-on for one service)
- Git push → auto-deploy (push to `main`, it redeploys in ~2 min)
- WebSockets work out of the box — no configuration needed
- No credit card required to start
- The only downside: the server sleeps after 15 minutes of inactivity and takes ~30 seconds
  to wake up on first connection. For a party game where someone opens it right before
  playing, this is acceptable.

---

## How to Deploy to Render (step by step)

### 1. Push to GitHub

```bash
cd /Users/nikkoong/Documents/objection
git init
git add .
git commit -m "initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/objection-game.git
git push -u origin main
```

### 2. Create the Render service

1. Go to https://render.com and sign up (free, no credit card)
2. Click **New → Web Service**
3. Connect your GitHub account and select `objection-game`
4. Configure:

| Setting | Value |
|---|---|
| **Name** | `objection-game` (or anything) |
| **Region** | Oregon (US West) or nearest to you |
| **Branch** | `main` |
| **Root Directory** | *(leave blank)* |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

5. Add environment variable:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |

6. Click **Create Web Service**

Render will build and deploy. You'll get a URL like:
`https://objection-game-xxxx.onrender.com`

### 3. Share the URL

That URL is public. Anyone on any device can open it and play.

---

## Alternative: Railway ($5 free credit)

Railway gives you $5 of free credit per month. This app uses ~$1–2/month on the
cheapest plan (512 MB RAM), so it's effectively free for light use.

**Setup:**
1. Go to https://railway.app and sign up with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select the repo
4. Railway auto-detects Node.js
5. Add env var: `NODE_ENV=production`
6. Add a custom domain or use the generated `.railway.app` URL

Railway does **not** sleep idle services, which means faster first-load.

---

## Alternative: Fly.io (always-on free VMs)

Fly.io gives 3 shared-CPU VMs permanently free (not just 12 months).

**Setup requires their CLI:**
```bash
# Install flyctl
brew install flyctl

# From the objection/ directory:
fly auth login
fly launch        # auto-detects Node, creates fly.toml
fly deploy
```

You'll need to add a `Dockerfile` or let Fly auto-detect. Slightly more setup than
Render but no sleep.

---

## Environment Variables (all platforms)

| Variable | Value | Required |
|---|---|---|
| `NODE_ENV` | `production` | Yes — enables static file serving |
| `PORT` | Set automatically by platform | No — read from `process.env.PORT` already |
| `CLIENT_URL` | Your public URL | Only if CORS errors appear |

---

## After Deploying

Test it works:
```
https://your-app.onrender.com         → should load the game UI
```

Share the URL with friends. Room codes work the same as local. No DNS or domain
purchase needed to play — the `.onrender.com` or `.railway.app` URL is enough.

To get a custom domain (e.g. `objection.yourdomain.com`), both Render and Railway
support adding one for free if you already own a domain.
