// Runs on every page at document_idle.
// Searches for Recipe structured data and notifies the background worker.
;(function () {
  function findRecipeSchema() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    for (const script of scripts) {
      try {
        const raw = JSON.parse(script.textContent)
        const items = Array.isArray(raw) ? raw : [raw]
        for (const item of items) {
          // Handle @graph arrays
          const candidates = item['@graph'] ? item['@graph'] : [item]
          for (const c of candidates) {
            const type = c['@type']
            const isRecipe = type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))
            if (isRecipe) return c
          }
        }
      } catch {}
    }
    return null
  }

  function parseIngredient(str) {
    const UNITS = new Set(['cup','cups','tablespoon','tablespoons','tbsp','tsp','teaspoon','teaspoons',
      'oz','ounce','ounces','lb','pound','pounds','g','gram','grams','kg','ml','milliliter',
      'liter','liters','clove','cloves','can','cans','slice','slices','pinch','dash',
      'large','medium','small','piece','pieces','bunch','head','stalk','stalks'])
    const parts = str.trim().split(/\s+/)
    let quantity = null, unit = null, nameStart = 0
    if (parts[0] && /^[\d¼½¾⅓⅔⅛⅜⅝⅞\/.-]+$/.test(parts[0])) {
      quantity = parts[0]; nameStart = 1
      if (parts[1] && UNITS.has(parts[1].toLowerCase())) {
        unit = parts[1]; nameStart = 2
      }
    }
    return { name: parts.slice(nameStart).join(' ') || str, quantity, unit }
  }

  function normalizeRecipe(schema) {
    const ingredients = (schema.recipeIngredient || []).map(parseIngredient)
    const instructions = (() => {
      const raw = schema.recipeInstructions || []
      if (typeof raw === 'string') return raw
      return raw.map(step => {
        if (typeof step === 'string') return step
        return step.text || step.name || ''
      }).filter(Boolean).join('\n\n')
    })()

    const cookTimeStr = schema.totalTime || schema.cookTime || ''
    const cookMins = cookTimeStr ? parseDuration(cookTimeStr) : null

    return {
      title: schema.name || document.title,
      image_url: Array.isArray(schema.image)
        ? (schema.image[0]?.url || schema.image[0])
        : (schema.image?.url || schema.image || null),
      ingredients,
      instructions,
      cook_time_mins: cookMins,
      servings: parseInt(schema.recipeYield) || null,
      url: location.href,
      source: 'content-script',
    }
  }

  function parseDuration(iso) {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
    if (!match) return null
    return (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0)
  }

  const schema = findRecipeSchema()
  if (schema) {
    chrome.runtime.sendMessage({
      type: 'RECIPE_DETECTED',
      tabId: null,
      recipe: normalizeRecipe(schema),
    }).catch(() => {})
  }

  // ── Pantry session relay ─────────────────────────────────────────────────────
  // When running on the Pantry web app, extract the Supabase session from
  // localStorage and send it to the background so the extension stays logged in.
  const PANTRY_HOSTS = new Set(['pantry-sigma-green.vercel.app', 'localhost', '127.0.0.1'])
  if (PANTRY_HOSTS.has(location.hostname)) {
    function extractSession() {
      try {
        const key = Object.keys(localStorage).find(
          (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
        )
        if (!key) return null
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
    }

    function trySendSession() {
      const session = extractSession()
      if (session) {
        chrome.runtime.sendMessage({ type: 'PANTRY_SESSION_FOUND', session }).catch(() => {})
      }
    }

    // Send immediately — covers the case where the user is already logged in
    trySendSession()

    // Poll for up to 10s — covers the magic link redirect case where Supabase
    // processes the token asynchronously after page load
    let attempts = 0
    const poll = setInterval(() => {
      if (++attempts >= 20) { clearInterval(poll); return }
      const session = extractSession()
      if (session) {
        chrome.runtime.sendMessage({ type: 'PANTRY_SESSION_FOUND', session }).catch(() => {})
        clearInterval(poll)
      }
    }, 500)

    // Respond to direct requests from the popup (via background)
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'GET_SUPABASE_SESSION') {
        sendResponse({ session: extractSession() })
        return true
      }
    })
  }
})()
