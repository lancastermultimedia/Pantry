# Pantry — Weekly Meal Planner

A full-stack weekly meal planning web app. Add recipe URLs to any day of the week, automatically scrape ingredients, and get a live shopping list that updates as meals are added or removed.

## Features

- **Weekly planner grid** — assign recipes to any meal slot (breakfast, lunch, dinner) across Mon–Sun
- **Recipe scraping** — paste any recipe URL and Pantry fetches the title, ingredients, and instructions automatically (Spoonacular API + `ld+json` schema fallback)
- **Live shopping list** — aggregates all ingredients for the week; toggle between "By Recipe" and "Combined" views
- **Cost estimates** — rough grocery cost per ingredient and weekly total
- **Recipe library** — save, favourite, and search all your recipes
- **Recurring meals** — mark a recipe as recurring and it auto-populates its slot every week
- **Day-of cooking mode** — clean, distraction-free recipe view with ingredient checklist and numbered steps
- **PWA** — installable on mobile (add to home screen)
- **Auth** — passwordless magic-link login via Supabase

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 |
| Routing | React Router v7 |
| Animations | Framer Motion |
| Auth / DB | Supabase (Postgres + Auth) |
| Backend | Node.js + Express |
| Recipe parsing | Spoonacular API + `ld+json` fallback |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Project Structure

```
pantry/
├── pantry-client/          ← Vite React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── lib/
│   ├── public/
│   ├── .env.example        ← copy to .env and fill in
│   └── vite.config.js
│
├── pantry-server/          ← Express scraping backend
│   ├── routes/scrape.js
│   ├── utils/recipeParser.js
│   ├── .env.example        ← copy to .env and fill in
│   └── index.js
│
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Spoonacular](https://spoonacular.com/food-api) API key (free tier: 150 req/day)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd pantry

cd pantry-client && npm install && cd ..
cd pantry-server && npm install && cd ..
```

### 2. Configure environment variables

**Frontend** (`pantry-client/.env`):

```bash
cp pantry-client/.env.example pantry-client/.env
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=          # leave blank locally — Vite proxies to localhost:3001
```

Find the Supabase values in your project → **Settings → API**.

**Backend** (`pantry-server/.env`):

```bash
cp pantry-server/.env.example pantry-server/.env
```

```env
SPOONACULAR_API_KEY=your-spoonacular-key-here
PORT=3001
CORS_ORIGIN=           # leave blank locally
```

### 3. Set up the database

Run the migration SQL in your Supabase project → **SQL Editor**:

```
pantry-client/supabase/migrations.sql
```

This creates the `recipe`, `meal_plan`, and `meal_slot` tables with Row Level Security.

### 4. Run locally

Two terminals required:

```bash
# Terminal 1 — Express backend (port 3001)
cd pantry-server && node index.js

# Terminal 2 — Vite dev server (port 5173)
cd pantry-client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> The app also runs in **mock mode** (no Supabase, hardcoded demo data) if you omit the Supabase env vars — useful for trying the UI without any setup.

---

## Deployment

### Step 1 — Deploy the backend to Railway

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Select your repo, set **Root Directory** to `pantry-server`
3. Railway detects Node.js automatically. The start command is `node index.js` (already in `package.json`).
4. Under **Variables**, add:
   | Variable | Value |
   |---|---|
   | `SPOONACULAR_API_KEY` | your Spoonacular key |
   | `CORS_ORIGIN` | *(leave blank for now — fill in after Vercel deploy)* |
5. Deploy. Copy the **public domain** Railway assigns (e.g. `https://pantry-server-production.up.railway.app`).

### Step 2 — Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project → Import Git Repository**
2. Select your repo, set **Root Directory** to `pantry-client`
3. Framework preset: **Vite**
4. Under **Environment Variables**, add:
   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `VITE_API_URL` | the Railway URL from Step 1 (no trailing slash) |
5. Deploy. Copy your Vercel URL (e.g. `https://pantry.vercel.app`).

### Step 3 — Connect CORS

Go back to Railway → your `pantry-server` service → **Variables** and set:

```
CORS_ORIGIN=https://pantry.vercel.app
```

Redeploy the backend (Railway does this automatically on variable changes).

### Step 4 — Update Supabase auth settings

In Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://pantry.vercel.app`
- **Redirect URLs**: add `https://pantry.vercel.app/**`

This is required for magic-link emails to redirect to your production app.

---

## Environment Variables Reference

### `pantry-client/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes (for auth) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes (for auth) | Supabase anon/public key |
| `VITE_API_URL` | Production only | Deployed backend base URL, e.g. `https://pantry-server.up.railway.app` |

### `pantry-server/.env`

| Variable | Required | Description |
|---|---|---|
| `SPOONACULAR_API_KEY` | Yes | Spoonacular API key for recipe scraping |
| `PORT` | No | Server port (default: 3001; Railway sets this automatically) |
| `CORS_ORIGIN` | Production only | Comma-separated allowed frontend origins, e.g. `https://pantry.vercel.app` |

---

## GitHub Secrets (for CI/CD)

If you add a GitHub Actions workflow to auto-deploy, add these secrets under  
**GitHub repo → Settings → Secrets and variables → Actions**:

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_API_URL` | Your Railway backend URL |
| `SPOONACULAR_API_KEY` | Your Spoonacular API key |

> Vercel and Railway both read env vars from their own dashboards during build/deploy — you only need GitHub Secrets if you're running builds inside GitHub Actions.
