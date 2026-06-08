import { createApi } from './api.js'

// ── Config & API ─────────────────────────────────────────────────────────────
const config = window.PANTRY_CONFIG
if (!config?.SUPABASE_URL) {
  document.getElementById('root').innerHTML =
    `<div style="padding:24px;color:#C4622D;font-size:13px;">
      ⚠️ <strong>config.js not found.</strong><br>
      Copy <code>config.example.js</code> to <code>config.js</code> and fill in your keys.
    </div>`
  throw new Error('Missing PANTRY_CONFIG')
}
const api = createApi(config)
const PANTRY_APP = 'https://pantry-sigma-green.vercel.app'

// ── Helpers ───────────────────────────────────────────────────────────────────
function el(id) { return document.getElementById(id) }

function getMondayOf(weekOffset = 0) {
  const now = new Date()
  const day = now.getDay()
  const daysToMon = day === 0 ? -6 : 1 - day
  const d = new Date(now)
  d.setDate(now.getDate() + daysToMon + weekOffset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISO(date) { return date.toISOString().split('T')[0] }

function getTodayIndex() {
  const d = new Date().getDay() // 0=Sun
  return d === 0 ? 6 : d - 1   // 0=Mon…6=Sun
}

function formatWeekLabel(offset) {
  if (offset === 0) return 'This week'
  if (offset === 1) return 'Next week'
  const m = getMondayOf(offset)
  return m.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dayName(i) { return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i] }
function fullDayName(i) { return ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i] }

// ── State ─────────────────────────────────────────────────────────────────────
const VIEWS = { LOADING: 'loading', LOGIN: 'login', WAITING: 'waiting',
  MAIN_RECIPE: 'main-recipe', MAIN_NO_RECIPE: 'main-no-recipe', SUCCESS: 'success' }

let state = {
  view: VIEWS.LOADING,
  session: null,       // { access_token, refresh_token, user_id, email }
  email: '',
  recipe: null,        // normalized recipe from content script or scrape
  tabUrl: '',
  profile: null,
  folders: [],
  sharedCalendars: [], // for current selected week
  selectedDay: getTodayIndex(),
  selectedMeal: 'dinner',
  weekOffset: 0,
  selectedPlanId: 'personal',
  selectedFolderId: '',
  searchQuery: '',
  searchResults: [],
  folderOpen: false,
  saving: false,
  error: '',
  successMsg: '',
}

// ── Chrome storage session helpers ────────────────────────────────────────────
async function loadStoredSession() {
  return new Promise(resolve => {
    chrome.storage.local.get(['pantry_session'], (r) => resolve(r.pantry_session ?? null))
  })
}
async function saveSession(session) {
  return new Promise(resolve => chrome.storage.local.set({ pantry_session: session }, resolve))
}
async function clearSession() {
  return new Promise(resolve => chrome.storage.local.remove('pantry_session', resolve))
}

// ── Tab + recipe helpers ──────────────────────────────────────────────────────
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}
async function getRecipeFromBackground(tabId) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_RECIPE', tabId }, (res) => {
      resolve(res?.recipe ?? null)
    })
  })
}
async function scrapeRecipeViaBackground(url) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'SCRAPE_RECIPE', url, apiUrl: config.API_URL }, (res) => {
      resolve(res?.recipe ?? null)
    })
  })
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function restoreSession() {
  const stored = await loadStoredSession()
  if (!stored?.refresh_token) return null
  try {
    const data = await api.refreshSession(stored.refresh_token)
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user_id: data.user?.id ?? stored.user_id,
      email: data.user?.email ?? stored.email,
    }
    await saveSession(session)
    return session
  } catch { return null }
}

async function tryGetSessionFromPantryTab() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_SESSION_FROM_PANTRY' }, (res) => {
      if (chrome.runtime.lastError) resolve(null)
      else resolve(res?.session ?? null)
    })
  })
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadUserData(session) {
  const [profile, folders] = await Promise.all([
    api.getProfile(session.access_token, session.user_id).catch(() => null),
    api.getFolders(session.access_token, session.user_id).catch(() => []),
  ])
  state.profile = profile
  state.folders = folders
}

async function loadSharedCalendars(session) {
  const weekStart = toISO(getMondayOf(state.weekOffset))
  state.sharedCalendars = await api.getSharedCalendarsForWeek(
    session.access_token, session.user_id, weekStart
  ).catch(() => [])
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  render()

  // Try stored/refreshed session first, then fall back to reading from a Pantry tab
  let session = await restoreSession()
  if (!session) {
    session = await tryGetSessionFromPantryTab()
    if (session) await saveSession(session)
  }

  const tab = await getCurrentTab()
  state.tabUrl = tab?.url ?? ''

  if (!session) { state.view = VIEWS.LOGIN; render(); return }

  state.session = session
  let recipe = await getRecipeFromBackground(tab?.id)

  if (!recipe && state.tabUrl && !state.tabUrl.startsWith('chrome://')) {
    recipe = await scrapeRecipeViaBackground(state.tabUrl)
  }

  state.recipe = recipe

  await Promise.all([loadUserData(session), loadSharedCalendars(session)])
  state.view = recipe ? VIEWS.MAIN_RECIPE : VIEWS.MAIN_NO_RECIPE
  render()
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const root = document.getElementById('root')
  switch (state.view) {
    case VIEWS.LOADING:    root.innerHTML = renderLoading(); break
    case VIEWS.LOGIN:      root.innerHTML = renderLogin(); break
    case VIEWS.WAITING:    root.innerHTML = renderWaiting(); break
    case VIEWS.MAIN_RECIPE:     root.innerHTML = renderMain(true); break
    case VIEWS.MAIN_NO_RECIPE:  root.innerHTML = renderMain(false); break
    case VIEWS.SUCCESS:    root.innerHTML = renderSuccess(); break
  }
  attachHandlers()
}

// ── View renderers ────────────────────────────────────────────────────────────
function renderLoading() {
  return `
    <div class="section">
      <div class="skeleton sk-thumb"></div>
      <div class="skeleton sk-line" style="width:70%"></div>
      <div class="skeleton sk-line" style="width:45%"></div>
      <div class="skeleton sk-line" style="width:90%; margin-top:16px;"></div>
    </div>`
}

function renderLogin() {
  return `
    ${renderHeader(false)}
    <div class="section" style="padding-top:24px; padding-bottom:24px; text-align:center;">
      <div style="font-size:32px; margin-bottom:12px;">🌿</div>
      <h1 style="margin-bottom:6px;">Sign in to Pantry</h1>
      <p class="muted" style="font-size:12px; margin-bottom:20px; line-height:1.6;">
        Open the Pantry web app to sign in — the extension will pick up your session automatically.
      </p>
      ${state.error ? `<p class="error-text" style="margin-bottom:10px;">${state.error}</p>` : ''}
      <button class="btn btn-primary" id="btn-open-pantry">
        Open Pantry to sign in →
      </button>
      <div style="margin-top:12px;">
        <button class="btn-link" id="btn-already-signed-in" style="font-size:11px; color:#8C8478;">
          Already signed in? Check now
        </button>
      </div>
    </div>`
}

function renderWaiting() {
  return `
    ${renderHeader(false)}
    <div class="section" style="padding-top:24px; padding-bottom:24px; text-align:center;">
      <div style="font-size:32px; margin-bottom:12px;">✉️</div>
      <h1 style="margin-bottom:6px;">Check your email</h1>
      <p class="muted" style="font-size:12px; margin-bottom:4px; line-height:1.6;">
        Enter your email on Pantry and click the sign-in link we send you.
      </p>
      <p class="muted" style="font-size:12px; margin-bottom:20px; line-height:1.6;">
        Once you've clicked the link, tap below:
      </p>
      ${state.error ? `<p class="error-text" style="margin-bottom:10px;">${state.error}</p>` : ''}
      <button class="btn btn-primary" id="btn-check-session">
        I've signed in →
      </button>
      <div style="margin-top:12px;">
        <button class="btn-link" id="btn-back-login" style="font-size:11px; color:#8C8478;">← Back</button>
      </div>
    </div>`
}

function renderHeader(showUser = true) {
  const name = state.profile?.display_name ?? state.session?.email ?? ''
  return `
    <div class="header">
      <div class="header-logo">
        <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"/></svg>
      </div>
      <span class="header-title">Pantry</span>
      ${showUser && name ? `<span class="header-user">${name}</span>` : ''}
      ${showUser ? `<button class="header-signout" id="btn-signout" title="Sign out">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
        </svg>
      </button>` : ''}
    </div>`
}

function renderMain(hasRecipe) {
  return `
    ${renderHeader(true)}
    ${hasRecipe ? renderRecipeSection() : renderNoRecipeSection()}
  `
}

function renderRecipeSection() {
  const r = state.recipe
  const imgHtml = r.image_url
    ? `<img class="recipe-thumb" src="${escapeAttr(r.image_url)}" alt="" />`
    : `<div class="recipe-thumb-placeholder">🍽️</div>`

  const cookMeta = r.cook_time_mins ? `${r.cook_time_mins} min` : ''
  const ingMeta = r.ingredients?.length ? `${r.ingredients.length} ingredients` : ''
  const meta = [cookMeta, ingMeta].filter(Boolean).join(' · ')

  // Day pills
  const dayPills = Array.from({ length: 7 }, (_, i) =>
    `<button class="pill${state.selectedDay === i ? ' active' : ''}" data-day="${i}">${dayName(i)}</button>`
  ).join('')

  // Meal pills
  const meals = ['breakfast', 'lunch', 'dinner']
  const mealPills = meals.map(m =>
    `<button class="pill${state.selectedMeal === m ? ' active' : ''}" data-meal="${m}">
      ${m[0].toUpperCase() + m.slice(1)}</button>`
  ).join('')

  // Week segmented control
  const weekBtns = [0, 1].map(i =>
    `<button class="seg-btn${state.weekOffset === i ? ' active' : ''}" data-week="${i}">
      ${formatWeekLabel(i)}</button>`
  ).join('')

  // Shared calendars dropdown (only if any exist)
  const calendarRow = state.sharedCalendars.length ? `
    <div style="margin-top:10px;">
      <label class="label">Calendar</label>
      <select id="sel-calendar">
        <option value="personal">Personal</option>
        ${state.sharedCalendars.map(c =>
          `<option value="${c.id}"${state.selectedPlanId === c.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`
        ).join('')}
      </select>
    </div>` : ''

  // Folder section (collapsible)
  const folderOptions = state.folders.length
    ? state.folders.map(f =>
        `<option value="${f.id}"${state.selectedFolderId === f.id ? ' selected' : ''}>
          ${escapeHtml(f.name)}</option>`
      ).join('')
    : '<option value="" disabled>No folders yet</option>'

  return `
    <div class="section" style="padding-top:12px; padding-bottom:0;">
      <div class="recipe-card">
        ${imgHtml}
        <div class="recipe-info">
          <div class="recipe-title">${escapeHtml(r.title)}</div>
          ${meta ? `<div class="recipe-meta"><span>${meta}</span></div>` : ''}
        </div>
      </div>
    </div>

    <div class="section">
      <span class="label">Add to meal plan</span>

      <div style="margin-bottom:10px;">
        <div class="seg-ctrl">${weekBtns}</div>
      </div>

      <div style="margin-bottom:10px;">
        <span class="label">Day</span>
        <div class="pill-group">${dayPills}</div>
      </div>

      <div style="margin-bottom:2px;">
        <span class="label">Meal</span>
        <div class="pill-group">${mealPills}</div>
      </div>

      ${calendarRow}
    </div>

    <div class="section">
      <div class="collapsible-trigger${state.folderOpen ? ' open' : ''}" id="folder-toggle">
        <span class="label" style="margin-bottom:0;">Save to folder</span>
        <span class="chevron">▼</span>
      </div>
      <div class="collapsible-body${state.folderOpen ? ' open' : ''}">
        <div style="margin-top:8px;">
          <select id="sel-folder">
            <option value="">No folder</option>
            ${folderOptions}
          </select>
        </div>
      </div>
    </div>

    ${state.error ? `<div class="section" style="padding-top:0;"><p class="error-text">${state.error}</p></div>` : ''}

    <div class="section" style="display:flex; gap:8px;">
      <button class="btn btn-secondary btn-sm" id="btn-save-library" ${state.saving ? 'disabled' : ''}>
        Save to library
      </button>
      <button class="btn btn-primary btn-sm" style="flex:1;" id="btn-add-plan" ${state.saving ? 'disabled' : ''}>
        ${state.saving ? 'Adding…' : 'Add to plan ›'}
      </button>
    </div>`
}

function renderNoRecipeSection() {
  return `
    <div class="section" style="padding-top:20px; padding-bottom:8px; text-align:center;">
      <div class="empty-icon">🔍</div>
      <h2 style="margin-bottom:4px;">Not a recipe page</h2>
      <p class="muted" style="font-size:12px; margin-bottom:14px;">
        Navigate to a recipe page to save it to Pantry.
      </p>
      <a href="${PANTRY_APP}" target="_blank" class="btn btn-primary btn-sm" style="width:auto; display:inline-flex;">
        Open Pantry ↗
      </a>
    </div>

    <div class="section">
      <label class="label">Search your recipes</label>
      <input id="search-input" type="text" placeholder="Search saved recipes…" value="${escapeAttr(state.searchQuery)}" />
      <div id="search-results" style="margin-top:8px;">
        ${renderSearchResults()}
      </div>
    </div>`
}

function renderSearchResults() {
  if (!state.searchResults.length && !state.searchQuery) return ''
  if (!state.searchResults.length) return `<p class="muted" style="font-size:12px; padding:8px 0;">No results found.</p>`
  return state.searchResults.map(r => `
    <a class="search-result" href="${PANTRY_APP}/recipe/${r.id}" target="_blank">
      ${r.image_url
        ? `<img class="search-thumb" src="${escapeAttr(r.image_url)}" alt="" />`
        : `<div class="search-thumb-placeholder">🍽️</div>`}
      <div>
        <div class="search-title">${escapeHtml(r.title)}</div>
        ${r.cook_time_mins ? `<div class="search-meta">${r.cook_time_mins} min</div>` : ''}
      </div>
    </a>`).join('')
}

function renderSuccess() {
  return `
    ${renderHeader(true)}
    <div class="section" style="padding:24px 16px; text-align:center;">
      <div class="success-icon">✓</div>
      <h2 style="margin-bottom:6px;">${escapeHtml(state.successMsg)}</h2>
      <p class="muted" style="font-size:12px; margin-bottom:16px;">${escapeHtml(state.recipe?.title ?? '')}</p>
      <a href="${PANTRY_APP}/planner" target="_blank" class="btn btn-primary btn-sm" style="display:inline-flex; width:auto;">
        Open Pantry ↗
      </a>
    </div>`
}

// ── Event handlers ────────────────────────────────────────────────────────────
function attachHandlers() {
  // Login
  document.getElementById('btn-open-pantry')?.addEventListener('click', handleOpenPantry)
  document.getElementById('btn-already-signed-in')?.addEventListener('click', handleCheckSession)

  // Waiting
  document.getElementById('btn-check-session')?.addEventListener('click', handleCheckSession)
  document.getElementById('btn-back-login')?.addEventListener('click', () => {
    state.view = VIEWS.LOGIN; state.error = ''; render()
  })

  // Sign out
  document.getElementById('btn-signout')?.addEventListener('click', handleSignOut)

  // Day pills
  document.querySelectorAll('[data-day]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedDay = parseInt(btn.dataset.day)
      refreshPills()
    })
  })

  // Meal pills
  document.querySelectorAll('[data-meal]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedMeal = btn.dataset.meal
      refreshPills()
    })
  })

  // Week buttons
  document.querySelectorAll('[data-week]').forEach(btn => {
    btn.addEventListener('click', async () => {
      state.weekOffset = parseInt(btn.dataset.week)
      if (state.session) await loadSharedCalendars(state.session)
      render()
    })
  })

  // Calendar select
  document.getElementById('sel-calendar')?.addEventListener('change', (e) => {
    state.selectedPlanId = e.target.value
  })

  // Folder toggle
  document.getElementById('folder-toggle')?.addEventListener('click', () => {
    state.folderOpen = !state.folderOpen
    const trigger = document.getElementById('folder-toggle')
    const body = trigger?.nextElementSibling
    trigger?.classList.toggle('open', state.folderOpen)
    body?.classList.toggle('open', state.folderOpen)
  })

  // Folder select
  document.getElementById('sel-folder')?.addEventListener('change', (e) => {
    state.selectedFolderId = e.target.value
  })

  // Add to plan
  document.getElementById('btn-add-plan')?.addEventListener('click', () => handleSave(true))

  // Save to library
  document.getElementById('btn-save-library')?.addEventListener('click', () => handleSave(false))

  // Search
  let searchTimer
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value
    clearTimeout(searchTimer)
    if (!state.searchQuery.trim()) { state.searchResults = []; updateSearchResults(); return }
    searchTimer = setTimeout(() => doSearch(), 300)
  })
}

function refreshPills() {
  document.querySelectorAll('[data-day]').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.day) === state.selectedDay)
  })
  document.querySelectorAll('[data-meal]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.meal === state.selectedMeal)
  })
}

function updateSearchResults() {
  const el_ = document.getElementById('search-results')
  if (el_) el_.innerHTML = renderSearchResults()
}

// ── Action handlers ───────────────────────────────────────────────────────────
async function handleOpenPantry() {
  state.error = ''
  await chrome.tabs.create({ url: PANTRY_APP + '/login' })
  state.view = VIEWS.WAITING
  render()
}

async function handleCheckSession() {
  const btn = document.getElementById('btn-check-session') ?? document.getElementById('btn-already-signed-in')
  if (btn) { btn.disabled = true; btn.textContent = 'Checking…' }
  state.error = ''

  let session = await restoreSession()
  if (!session) session = await tryGetSessionFromPantryTab()

  if (!session) {
    state.error = "Not signed in yet — click the link in your email first, then try again."
    render()
    return
  }

  await saveSession(session)
  state.session = session
  state.view = VIEWS.LOADING
  render()
  await init()
}

async function handleSignOut() {
  await clearSession()
  state.session = null; state.profile = null; state.folders = []
  state.recipe = null; state.view = VIEWS.LOGIN
  render()
}

async function handleSave(addToSlot) {
  if (state.saving || !state.session || !state.recipe) return
  state.saving = true; state.error = ''; render()

  const { access_token, user_id } = state.session

  try {
    // Find or reuse existing recipe
    let recipeId = null
    const existing = await api.getRecipeByUrl(access_token, state.tabUrl)
    if (existing) {
      recipeId = existing.id
      // Update folder if selected
      if (state.selectedFolderId) {
        await api.updateRecipeFolder(access_token, recipeId, state.selectedFolderId)
      }
    } else {
      // If content script didn't get ingredients, try scraping backend
      let recipe = state.recipe
      if (!recipe.ingredients?.length && config.API_URL) {
        try {
          const scraped = await api.scrapeRecipe(state.tabUrl)
          recipe = { ...recipe, ...scraped, url: state.tabUrl }
        } catch {}
      }
      recipeId = await api.saveRecipe(access_token, user_id, recipe, state.selectedFolderId || null)
    }

    if (!recipeId) throw new Error('Could not save recipe.')

    if (addToSlot) {
      const weekStart = toISO(getMondayOf(state.weekOffset))
      let planId
      if (state.selectedPlanId === 'personal') {
        planId = await api.getOrCreateMealPlan(access_token, user_id, weekStart)
      } else {
        planId = state.selectedPlanId
      }
      await api.addMealSlot(access_token, planId, state.selectedDay, state.selectedMeal, recipeId, user_id)
      state.successMsg = `Added to ${fullDayName(state.selectedDay)} ${state.selectedMeal}!`
    } else {
      state.successMsg = 'Saved to library!'
    }

    state.saving = false
    state.view = VIEWS.SUCCESS
    render()
  } catch (e) {
    state.error = e.message || 'Something went wrong.'
    state.saving = false
    render()
  }
}

async function doSearch() {
  if (!state.session) return
  try {
    state.searchResults = await api.searchRecipes(
      state.session.access_token, state.session.user_id, state.searchQuery
    )
    updateSearchResults()
  } catch {}
}

// ── Sanitization ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
function escapeAttr(str) { return escapeHtml(str) }

// ── Start ─────────────────────────────────────────────────────────────────────
init()
