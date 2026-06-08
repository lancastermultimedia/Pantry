// Background service worker — caches detected recipes per tab,
// serves them to the popup on request, handles scraping fallback,
// and relays the Pantry web app session to extension storage.

const recipeCache = new Map() // tabId -> recipe

const PANTRY_URL_PATTERNS = [
  '*://pantry-sigma-green.vercel.app/*',
  '*://localhost:*/*',
  '*://127.0.0.1:*/*',
]

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'RECIPE_DETECTED' && sender.tab?.id) {
    recipeCache.set(sender.tab.id, msg.recipe)
  }

  if (msg.type === 'GET_RECIPE') {
    sendResponse({ recipe: recipeCache.get(msg.tabId) ?? null })
    return true
  }

  if (msg.type === 'SCRAPE_RECIPE') {
    handleScrape(msg.url, msg.apiUrl).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message })
    })
    return true
  }

  // Content script on the Pantry web app found a session — cache it
  if (msg.type === 'PANTRY_SESSION_FOUND' && msg.session) {
    chrome.storage.local.set({ pantry_session: msg.session })
  }

  // Popup asks us to query any open Pantry tab for a session
  if (msg.type === 'GET_SESSION_FROM_PANTRY') {
    getSessionFromPantryTab().then(sendResponse).catch(() => sendResponse({ session: null }))
    return true
  }
})

// Clear cache when tab navigates away
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') recipeCache.delete(tabId)
})

async function handleScrape(url, apiUrl) {
  const base = apiUrl?.replace(/\/$/, '') || ''
  const res = await fetch(`${base}/api/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) throw new Error('Scrape failed')
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return { recipe: { ...data, url, source: 'scrape' } }
}

async function getSessionFromPantryTab() {
  let tabs = []
  for (const pattern of PANTRY_URL_PATTERNS) {
    try {
      const found = await chrome.tabs.query({ url: pattern })
      tabs = tabs.concat(found)
    } catch {}
  }

  for (const tab of tabs) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const key = Object.keys(localStorage).find(
            (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
          )
          if (!key) return null
          try {
            const data = JSON.parse(localStorage.getItem(key))
            const s = data?.currentSession ?? data
            if (s?.access_token && s?.refresh_token) {
              return {
                access_token: s.access_token,
                refresh_token: s.refresh_token,
                user_id: s.user?.id ?? null,
                email: s.user?.email ?? null,
              }
            }
          } catch {}
          return null
        },
      })
      const session = results?.[0]?.result
      if (session) return { session }
    } catch {}
  }
  return { session: null }
}
