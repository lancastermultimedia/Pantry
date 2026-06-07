# Pantry — Meal Planner App: Full Build Spec

You are building **Pantry**, a full-stack meal planning web app. This document is the complete specification. Build it phase by phase as instructed. Read the entire spec before writing any code.

---

## What Pantry Does

Pantry is a weekly meal planner that lets users:
1. Add recipe links to any day of the week (breakfast, lunch, dinner)
2. Automatically scrape those recipe pages for ingredients
3. See a live, beautiful shopping list that updates as recipes are added or removed
4. Get a plain-text recipe view on the day of cooking
5. Save favourite recipes and mark them as recurring
6. See an estimated weekly grocery cost

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React (Vite) | Component-based UI |
| Styling | Tailwind CSS | Utility-first, no component libraries |
| Backend | Node.js + Express | Handles scraping proxy, API routes |
| Database | Supabase (Postgres) | Auth, meal plans, saved recipes |
| Recipe Parsing | `recipe-scrapers` via Python microservice OR Spoonacular API | See Phase 3 |
| State | Zustand | Lightweight global state |
| Routing | React Router v6 | Client-side routing |

---

## Design Direction

**Aesthetic**: Warm, editorial, organic. Think a beautifully designed recipe magazine digitised — cream/off-white backgrounds, deep forest green as the primary accent, warm serif display font for headings, clean sans-serif for body. Not sterile, not corporate. Feels like a kitchen notebook.

**Typography**:
- Display/headings: `Playfair Display` (Google Fonts)
- Body/UI: `DM Sans` (Google Fonts)

**Colour palette** (use as CSS variables):
```css
--pantry-cream: #FAF7F2;
--pantry-ink: #1C1C1A;
--pantry-green: #2D5016;
--pantry-green-light: #4A7C28;
--pantry-warm-grey: #8C8478;
--pantry-border: #E8E2D9;
--pantry-accent: #C4622D; /* warm terracotta for highlights */
```

**Layout feel**: Generous whitespace. The weekly planner is a 7-column grid. Cards are clean with subtle shadows. The shopping list panel slides in from the right or sits in a fixed right column on desktop. Mobile collapses to a single column with tab navigation.

**Micro-interactions**: Smooth transitions when adding/removing recipes. Shopping list items animate in/out. Use Framer Motion for React animations.

---

## Data Models

### `meal_plan` table (Supabase)
```sql
id uuid primary key
user_id uuid references auth.users
week_start date  -- Monday of the planned week
created_at timestamp
```

### `meal_slot` table
```sql
id uuid primary key
meal_plan_id uuid references meal_plan
day_of_week int  -- 0=Mon, 6=Sun
meal_type text   -- 'breakfast' | 'lunch' | 'dinner'
recipe_id uuid references recipe
```

### `recipe` table
```sql
id uuid primary key
user_id uuid references auth.users
url text
title text
image_url text
ingredients jsonb  -- array of { name, quantity, unit, estimated_cost_usd }
instructions text  -- plain text, cleaned
cook_time_mins int
servings int
is_favourite boolean default false
is_recurring boolean default false
recurrence_rule text  -- e.g. 'weekly:monday:dinner'
scraped_at timestamp
created_at timestamp
```

### `shopping_list` (derived — not stored, computed on the fly from meal_slots + recipes)

---

## App Structure / Routes

```
/                     → redirect to /planner
/planner              → main weekly planner view
/planner/:weekStart   → specific week (YYYY-MM-DD format, Monday)
/recipe/:id           → full plain-text recipe view (day-of cooking mode)
/recipes              → saved recipes library
/shopping             → full-page shopping list for current week
```

---

## Phase 1 — Project Scaffold & Planner UI

**Goal**: Working weekly planner grid with hardcoded mock data. No backend yet.

### Tasks:
1. Scaffold Vite + React project in the `pantry/` folder
2. Install dependencies: `tailwindcss`, `framer-motion`, `zustand`, `react-router-dom`, `@supabase/supabase-js`, `lucide-react`
3. Set up Google Fonts (Playfair Display + DM Sans) in `index.html`
4. Set up CSS variables in `index.css`
5. Build the weekly planner grid:
   - 7 columns (Mon–Sun), 3 rows (Breakfast / Lunch / Dinner)
   - Each cell is a `MealSlot` component
   - Empty slot shows a `+` add button
   - Filled slot shows recipe title, small thumbnail, and a remove `×` button
   - Week navigation arrows (prev/next week) in the header
   - "Today" highlight on current day column
6. Build a `WeekHeader` component showing the week date range
7. Use Zustand store for meal plan state (mock data fine for now)
8. Right panel: `ShoppingListPanel` component — static placeholder for now
9. Responsive: desktop = grid + right panel; mobile = grid only with bottom nav to shopping list

**Deliverable**: A beautiful, navigable weekly grid that looks production-ready with mock recipe cards.

---

## Phase 2 — Supabase Setup & Auth

**Goal**: Real persistence. Users can log in and their meal plans save.

### Tasks:
1. Create Supabase project and run the SQL migrations for all tables above
2. Set up `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Build `AuthProvider` context wrapping the app
4. Build a minimal `/login` page — email magic link (passwordless) — styled on-brand
5. Protect `/planner`, `/recipes`, `/shopping` routes
6. Connect Zustand store to Supabase:
   - Load current week's meal plan on mount
   - Save meal slot changes in real time
7. Add a user avatar / logout button in the top-right header

**Deliverable**: Full auth flow. Meal plans persist across sessions.

---

## Phase 3 — Recipe Scraping Backend

**Goal**: Paste a recipe URL, get back title, image, ingredients, and instructions automatically.

### Approach:
Use a small **Express backend** as a scraping proxy (avoids CORS). For recipe parsing, use the **Spoonacular API** (free tier: 150 requests/day) as it's the most reliable cross-site option.

Fallback: if Spoonacular fails, attempt raw HTML scrape looking for `application/ld+json` structured data with `@type: Recipe` — most modern recipe sites include this.

### Backend tasks:
1. Create `pantry-server/` directory alongside the React app
2. `npm init` + install: `express`, `cors`, `dotenv`, `axios`, `cheerio`
3. Add `SPOONACULAR_API_KEY` to `.env`
4. Build `POST /api/scrape` endpoint:
   ```
   Request:  { url: string }
   Response: { title, image_url, ingredients: [{name, quantity, unit}], instructions, cook_time_mins, servings }
   ```
5. Scraping logic priority:
   a. Try Spoonacular `GET /recipes/extract?url=...`
   b. If that fails, fetch the URL and parse `<script type="application/ld+json">` for Recipe schema
   c. If that fails, return `{ error: 'Could not parse recipe' }`
6. Add basic rate limiting (express-rate-limit) — 30 requests per 15 min per IP

### Frontend tasks:
1. Build `AddRecipeModal` component:
   - URL input field
   - "Fetch Recipe" button triggers scraping
   - Loading state (nice skeleton animation)
   - Preview card showing scraped result before confirming
   - Error state with helpful message
2. On confirm: save recipe to Supabase `recipe` table, add to meal slot
3. Cost estimation: add a `estimateCost(ingredients)` utility that applies rough average US grocery prices per common unit (a static lookup table is fine — e.g. `per_100g: { chicken: 0.80, pasta: 0.15, ... }`)

**Deliverable**: Paste any recipe URL into a meal slot and it populates automatically.

---

## Phase 4 — Live Shopping List

**Goal**: A beautiful, real-time shopping list derived from all recipes in the current week.

### Logic:
- Aggregate all ingredients across all meal slots for the week
- Group by recipe (primary grouping) with a "combined view" toggle that merges duplicates
- Each ingredient line: checkbox (to mark as bought), quantity, unit, ingredient name
- Running total cost estimate at the bottom
- Removed recipes instantly remove their ingredients from the list

### UI tasks:
1. `ShoppingListPanel` (right sidebar on desktop, full page on mobile `/shopping`):
   - Header: "Shopping List — Week of [date]"
   - Grouped by recipe with collapsible sections
   - Each ingredient: `[ ] 400g chicken breast ~$3.20`
   - Toggle: "By Recipe" / "Combined" view
   - Combined view merges same ingredients (e.g. 2 recipes both use garlic → `6 cloves garlic`)
   - Checked items fade and move to bottom
   - "Copy list" button — copies plain text to clipboard
   - "Clear checked" button
2. Cost summary card:
   - Estimated total for the week
   - Per-day average
   - Disclaimer: "Estimates based on average US grocery prices"
3. Animate ingredient rows in/out with Framer Motion when recipes are added/removed

**Deliverable**: Live, beautiful shopping list that reacts to every change in the planner.

---

## Phase 5 — Recipe View & Saved Recipes

**Goal**: Day-of cooking mode + recipe library.

### Recipe View (`/recipe/:id`):
- Clean, distraction-free layout
- Large recipe title in Playfair Display
- Cook time + servings at the top
- Ingredients as a simple checklist
- Instructions as numbered plain-text steps
- "Back to planner" button
- Optimised for mobile (someone standing in a kitchen reading their phone)

### Saved Recipes (`/recipes`):
- Grid of recipe cards (title, image, cook time)
- Filter bar: All / Favourites / Recurring
- Heart icon to toggle favourite
- Recurring toggle — opens a small modal to set which day/meal it auto-populates
- Search by title
- Click card → goes to `/recipe/:id`
- "Add to week" button on each card opens a slot picker

### Recurring recipes:
- On week load, auto-populate slots with recurring recipes
- Show a small 🔁 badge on recurring slots in the planner
- Users can override a recurring slot for a specific week without affecting the recurrence rule

**Deliverable**: Full recipe library with favourites, recurring meals, and a beautiful cooking view.

---

## Phase 6 — Polish & Production

### Tasks:
1. Empty states: beautiful illustrated empty states for no recipes, no meal plan, empty shopping list
2. Onboarding: first-time user sees a 3-step tooltip tour
3. PWA: add `manifest.json` and service worker so it's installable on mobile
4. Loading skeletons everywhere (no spinners — skeleton screens only)
5. Error boundaries around scraping failures
6. `README.md` with setup instructions, env vars, how to run locally, how to deploy
7. Deployment config: Vercel for frontend, Railway or Render for the Express backend

---

## File Structure

```
pantry/
├── pantry-client/          ← Vite React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── planner/
│   │   │   │   ├── WeekGrid.jsx
│   │   │   │   ├── MealSlot.jsx
│   │   │   │   ├── WeekHeader.jsx
│   │   │   │   └── AddRecipeModal.jsx
│   │   │   ├── shopping/
│   │   │   │   ├── ShoppingListPanel.jsx
│   │   │   │   ├── IngredientRow.jsx
│   │   │   │   └── CostSummary.jsx
│   │   │   ├── recipe/
│   │   │   │   ├── RecipeView.jsx
│   │   │   │   └── RecipeCard.jsx
│   │   │   └── ui/
│   │   │       ├── Button.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── Skeleton.jsx
│   │   ├── pages/
│   │   │   ├── Planner.jsx
│   │   │   ├── Recipe.jsx
│   │   │   ├── Recipes.jsx
│   │   │   ├── Shopping.jsx
│   │   │   └── Login.jsx
│   │   ├── store/
│   │   │   ├── mealPlanStore.js
│   │   │   └── recipeStore.js
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   └── costEstimator.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── pantry-server/          ← Express scraping backend
│   ├── routes/
│   │   └── scrape.js
│   ├── utils/
│   │   └── recipeParser.js
│   ├── index.js
│   └── package.json
│
└── README.md
```

---

## Instructions for Claude in VS Code

- **Build one phase at a time.** Do not move to the next phase until the current one is working and visually complete.
- **Always write real, working code.** No placeholders, no `// TODO` comments left unimplemented within the current phase.
- **Design quality matters.** The UI should look like a real product, not a tutorial project. Refer to the design direction section for every component you build.
- **Ask before making structural changes** to the data models or file structure defined here.
- **When in doubt about a recipe scraping edge case**, fail gracefully with a clear error message to the user rather than crashing.
- **Use TypeScript** if you're comfortable — the spec uses `.jsx` but `.tsx` is preferred if you want to add it.
- **Commit-ready code**: each phase should end in a state that builds and runs without errors.

---

## To Start

Say: **"Build Phase 1 of the Pantry app"** and Claude will scaffold the project and build the weekly planner grid.
