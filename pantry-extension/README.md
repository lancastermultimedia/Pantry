# Pantry Chrome Extension

Save recipes from any webpage directly to your Pantry meal plan.

## Setup

### 1. Add your config

```bash
cp config.example.js config.js
```

Open `config.js` and fill in:

```js
window.PANTRY_CONFIG = {
  SUPABASE_URL: 'https://your-project-ref.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  API_URL: 'https://your-railway-backend.railway.app',  // or http://localhost:3001 for dev
}
```

- **SUPABASE_URL** and **SUPABASE_ANON_KEY**: Supabase Dashboard → Project Settings → API
- **API_URL**: your deployed Railway backend (or local server URL)

### 2. Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `pantry-extension/` folder

The Pantry icon will appear in your toolbar. Pin it for easy access.

### 3. Sign in

Click the extension icon on any page. Enter your Pantry email address — you'll receive a **6-digit code** in your email. Enter the code and you're in. You'll stay signed in unless you explicitly sign out.

## How it works

| Situation | What happens |
|---|---|
| Recipe page (has structured data) | Popup shows recipe details immediately |
| Recipe page (no structured data) | Extension calls scraping backend, shows result |
| Non-recipe page | Shows search bar for your saved recipes |

**Adding to your meal plan:**
1. Pick the week (this week / next week)
2. Pick the day (Mon–Sun, today is pre-selected)
3. Pick the meal (Breakfast / Lunch / Dinner)
4. If you have shared calendars for that week, you can choose between personal and shared
5. Optionally assign to a folder
6. Click **Add to plan** or **Save to library** (library only, no slot)

## Regenerate icons

If you want to recreate the default icons:

```bash
node generate-icons.js
```

Replace the files in `icons/` with your own PNGs if you prefer custom artwork (16×16, 48×48, 128×128).

## Chrome Web Store submission

1. Remove `config.js` (it's gitignored, never ship real keys)
2. Zip the entire `pantry-extension/` folder
3. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Upload the zip

> For a published extension, move the Supabase keys to a build step that injects them, rather than a local `config.js`.
