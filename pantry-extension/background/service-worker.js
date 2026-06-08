// Background service worker — caches detected recipes per tab,
// serves them to the popup on request, and handles scraping fallback.

const recipeCache = new Map() // tabId -> recipe

// Cache recipe when content script detects one
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'RECIPE_DETECTED' && sender.tab?.id) {
    recipeCache.set(sender.tab.id, msg.recipe)
  }
  if (msg.type === 'GET_RECIPE') {
    const recipe = recipeCache.get(msg.tabId) ?? null
    sendResponse({ recipe })
    return true
  }
  if (msg.type === 'SCRAPE_RECIPE') {
    handleScrape(msg.url, msg.apiUrl).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message })
    })
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
