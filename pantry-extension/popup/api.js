// Thin wrappers around Supabase REST API and Pantry scraping backend.
// No SDK dependency — pure fetch.

export function createApi({ SUPABASE_URL, SUPABASE_ANON_KEY, API_URL }) {
  const base = SUPABASE_URL.replace(/\/$/, '')
  const restBase = `${base}/rest/v1`
  const authBase = `${base}/auth/v1`
  const apiBase = (API_URL || '').replace(/\/$/, '')

  async function authFetch(path, body) {
    const res = await fetch(`${authBase}${path}`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.msg || data.error_description || data.error || 'Auth error')
    return data
  }

  async function restFetch(path, options = {}, token) {
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
      ...options.headers,
    }
    const res = await fetch(`${restBase}${path}`, { ...options, headers })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `HTTP ${res.status}`)
    }
    if (res.status === 204) return null
    return res.json()
  }

  return {
    // ── Auth ──────────────────────────────────────────────────
    async sendOtp(email) {
      await authFetch('/otp', { email })
    },
    async verifyOtp(email, token) {
      return authFetch('/verify', { type: 'email', email, token })
    },
    async refreshSession(refresh_token) {
      return authFetch('/token?grant_type=refresh_token', { refresh_token })
    },

    // ── Profile ───────────────────────────────────────────────
    async getProfile(token, userId) {
      const data = await restFetch(`/profiles?id=eq.${userId}&select=display_name,avatar_url`, {}, token)
      return data?.[0] ?? null
    },

    // ── Folders ───────────────────────────────────────────────
    async getFolders(token, userId) {
      return restFetch(`/folders?user_id=eq.${userId}&select=id,name,color&order=created_at.asc`, {}, token) ?? []
    },

    // ── Recipes ───────────────────────────────────────────────
    async getRecipeByUrl(token, url) {
      const encoded = encodeURIComponent(url)
      const data = await restFetch(`/recipe?url=eq.${encoded}&select=id,title,image_url,cook_time_mins,ingredients`, {}, token)
      return data?.[0] ?? null
    },
    async saveRecipe(token, userId, recipe, folderId) {
      const data = await restFetch('/recipe?select=id', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          user_id: userId,
          url: recipe.url,
          title: recipe.title,
          image_url: recipe.image_url ?? null,
          ingredients: recipe.ingredients ?? [],
          instructions: recipe.instructions ?? null,
          cook_time_mins: recipe.cook_time_mins ?? null,
          servings: recipe.servings ?? null,
          folder_id: folderId ?? null,
          scraped_at: new Date().toISOString(),
        }),
      }, token)
      return data?.[0]?.id ?? null
    },
    async updateRecipeFolder(token, recipeId, folderId) {
      await restFetch(`/recipe?id=eq.${recipeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ folder_id: folderId }),
      }, token)
    },

    // ── Meal plans ────────────────────────────────────────────
    async getMealPlan(token, userId, weekStart) {
      const data = await restFetch(
        `/meal_plan?user_id=eq.${userId}&week_start=eq.${weekStart}&select=id`,
        {}, token
      )
      return data?.[0]?.id ?? null
    },
    async createMealPlan(token, userId, weekStart) {
      const data = await restFetch('/meal_plan?select=id', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({ user_id: userId, week_start: weekStart }),
      }, token)
      return data?.[0]?.id ?? null
    },
    async getOrCreateMealPlan(token, userId, weekStart) {
      let id = await this.getMealPlan(token, userId, weekStart)
      if (!id) id = await this.createMealPlan(token, userId, weekStart)
      return id
    },

    // ── Shared calendars ──────────────────────────────────────
    async getSharedCalendarsForWeek(token, userId, weekStart) {
      const memberships = await restFetch(
        `/meal_plan_members?user_id=eq.${userId}&select=meal_plan_id`,
        {}, token
      ) ?? []
      if (!memberships.length) return []
      const ids = memberships.map(m => m.meal_plan_id).join(',')
      const plans = await restFetch(
        `/meal_plan?id=in.(${ids})&week_start=eq.${weekStart}&select=id,name`,
        {}, token
      ) ?? []
      return plans
    },

    // ── Meal slots ────────────────────────────────────────────
    async addMealSlot(token, planId, dayOfWeek, mealType, recipeId, userId) {
      await restFetch('/meal_slot', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          meal_plan_id: planId,
          day_of_week: dayOfWeek,
          meal_type: mealType,
          recipe_id: recipeId,
          added_by: userId,
        }),
      }, token)
    },

    // ── Search recipes ────────────────────────────────────────
    async searchRecipes(token, userId, query) {
      const encoded = encodeURIComponent(`%${query}%`)
      return restFetch(
        `/recipe?user_id=eq.${userId}&title=ilike.${encoded}&select=id,title,image_url,cook_time_mins&limit=10`,
        {}, token
      ) ?? []
    },

    // ── Scraping backend ──────────────────────────────────────
    async scrapeRecipe(url) {
      const res = await fetch(`${apiBase}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error('Could not parse recipe')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data
    },
  }
}
