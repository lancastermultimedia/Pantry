import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { SUPABASE_CONFIGURED } from '../lib/auth'

// ── Date helpers ──────────────────────────────────────────────

function getMondayOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatDate(date) {
  return date.toISOString().split('T')[0]
}

const THIS_WEEK = formatDate(getMondayOfWeek(new Date()))

// ── Mock data ─────────────────────────────────────────────────

const MOCK_RECIPES = {
  r1: {
    id: 'r1',
    title: 'Lemon Herb Roast Chicken',
    image_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400&q=80',
    cook_time_mins: 90, servings: 4,
    ingredients: [
      { name: 'Whole chicken', quantity: '1.5', unit: 'kg' },
      { name: 'Lemon', quantity: '2', unit: 'whole' },
      { name: 'Garlic', quantity: '6', unit: 'cloves' },
      { name: 'Fresh thyme', quantity: '4', unit: 'sprigs' },
      { name: 'Olive oil', quantity: '3', unit: 'tbsp' },
    ],
    instructions: '1. Preheat oven to 200°C. 2. Pat chicken dry. 3. Rub with oil, herbs, lemon zest. 4. Roast 1.5 hours.',
    is_favourite: true, is_recurring: false,
  },
  r2: {
    id: 'r2',
    title: 'Pasta al Pomodoro',
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80',
    cook_time_mins: 25, servings: 2,
    ingredients: [
      { name: 'Spaghetti', quantity: '200', unit: 'g' },
      { name: 'San Marzano tomatoes', quantity: '400', unit: 'g' },
      { name: 'Garlic', quantity: '3', unit: 'cloves' },
      { name: 'Fresh basil', quantity: '1', unit: 'bunch' },
      { name: 'Parmesan', quantity: '60', unit: 'g' },
    ],
    instructions: '1. Boil salted water. 2. Sauté garlic in oil. 3. Add crushed tomatoes, simmer 15 min. 4. Cook pasta al dente, toss together.',
    is_favourite: false, is_recurring: true, recurrence_rule: 'weekly:2:dinner',
  },
  r3: {
    id: 'r3',
    title: 'Avocado & Egg Toast',
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80',
    cook_time_mins: 10, servings: 1,
    ingredients: [
      { name: 'Sourdough bread', quantity: '2', unit: 'slices' },
      { name: 'Avocado', quantity: '1', unit: 'whole' },
      { name: 'Eggs', quantity: '2', unit: 'whole' },
      { name: 'Chilli flakes', quantity: '1', unit: 'tsp' },
      { name: 'Lemon juice', quantity: '1', unit: 'tsp' },
    ],
    instructions: '1. Toast bread. 2. Mash avocado with lemon, salt, chilli. 3. Fry or poach eggs. 4. Assemble.',
    is_favourite: true, is_recurring: false,
  },
  r4: {
    id: 'r4',
    title: 'Green Goddess Salad',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    cook_time_mins: 15, servings: 2,
    ingredients: [
      { name: 'Mixed greens', quantity: '150', unit: 'g' },
      { name: 'Cucumber', quantity: '1', unit: 'whole' },
      { name: 'Avocado', quantity: '1', unit: 'whole' },
      { name: 'Tahini', quantity: '2', unit: 'tbsp' },
      { name: 'Lemon', quantity: '1', unit: 'whole' },
    ],
    instructions: '1. Blend tahini, lemon, garlic, herbs for dressing. 2. Chop and combine salad ingredients. 3. Drizzle dressing.',
    is_favourite: false, is_recurring: false,
  },
  r5: {
    id: 'r5',
    title: 'Overnight Oats with Berries',
    image_url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&q=80',
    cook_time_mins: 5, servings: 1,
    ingredients: [
      { name: 'Rolled oats', quantity: '80', unit: 'g' },
      { name: 'Oat milk', quantity: '200', unit: 'ml' },
      { name: 'Chia seeds', quantity: '1', unit: 'tbsp' },
      { name: 'Mixed berries', quantity: '100', unit: 'g' },
      { name: 'Honey', quantity: '1', unit: 'tsp' },
    ],
    instructions: '1. Mix oats, milk, chia seeds, honey. 2. Refrigerate overnight. 3. Top with berries before serving.',
    is_favourite: false, is_recurring: true, recurrence_rule: 'weekly:5:breakfast',
  },
}

const MOCK_SLOTS = [
  { id: 's1', day_of_week: 0, meal_type: 'breakfast', recipe_id: 'r5' },
  { id: 's2', day_of_week: 0, meal_type: 'lunch', recipe_id: 'r4' },
  { id: 's3', day_of_week: 0, meal_type: 'dinner', recipe_id: 'r1' },
  { id: 's4', day_of_week: 2, meal_type: 'breakfast', recipe_id: 'r3' },
  { id: 's5', day_of_week: 2, meal_type: 'dinner', recipe_id: 'r2' },
  { id: 's6', day_of_week: 4, meal_type: 'lunch', recipe_id: 'r4' },
  { id: 's7', day_of_week: 5, meal_type: 'breakfast', recipe_id: 'r5' },
  { id: 's8', day_of_week: 5, meal_type: 'dinner', recipe_id: 'r1' },
]

// ── Supabase helpers ──────────────────────────────────────────

async function fetchOrCreateMealPlan(userId, weekStart) {
  const { data: existing } = await supabase
    .from('meal_plan').select('id')
    .eq('user_id', userId).eq('week_start', weekStart).single()
  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('meal_plan').insert({ user_id: userId, week_start: weekStart })
    .select('id').single()
  if (error) throw error
  return created.id
}

async function loadWeekData(userId, weekStart) {
  const planId = await fetchOrCreateMealPlan(userId, weekStart)

  const { data: slots = [], error: slotsErr } = await supabase
    .from('meal_slot').select('id, day_of_week, meal_type, recipe_id')
    .eq('meal_plan_id', planId)
  if (slotsErr) throw slotsErr

  const recipeIds = [...new Set(slots.map((s) => s.recipe_id))]
  let recipesMap = {}
  if (recipeIds.length) {
    const { data: recipes = [] } = await supabase.from('recipe').select('*').in('id', recipeIds)
    recipesMap = Object.fromEntries(recipes.map((r) => [r.id, r]))
  }

  // Auto-populate recurring recipes into empty slots
  const { data: recurring = [] } = await supabase
    .from('recipe').select('*').eq('user_id', userId).eq('is_recurring', true)

  const filledKeys = new Set(slots.map((s) => `${s.day_of_week}-${s.meal_type}`))

  for (const recipe of recurring) {
    if (!recipe.recurrence_rule) continue
    const parts = recipe.recurrence_rule.split(':')
    const day_of_week = parseInt(parts[1])
    const meal_type = parts[2]
    if (!filledKeys.has(`${day_of_week}-${meal_type}`)) {
      const { data: newSlot } = await supabase
        .from('meal_slot')
        .upsert({ meal_plan_id: planId, day_of_week, meal_type, recipe_id: recipe.id },
          { onConflict: 'meal_plan_id,day_of_week,meal_type' })
        .select('id, day_of_week, meal_type, recipe_id').single()
      if (newSlot) {
        slots.push(newSlot)
        filledKeys.add(`${day_of_week}-${meal_type}`)
        recipesMap[recipe.id] = recipe
      }
    }
  }

  return { planId, slots, recipes: recipesMap }
}

// ── Store ─────────────────────────────────────────────────────

export const useMealPlanStore = create((set, get) => ({
  weekStart: THIS_WEEK,
  mealSlots: SUPABASE_CONFIGURED ? [] : MOCK_SLOTS,
  recipes: SUPABASE_CONFIGURED ? {} : MOCK_RECIPES,
  allRecipes: SUPABASE_CONFIGURED ? {} : MOCK_RECIPES,
  currentPlanId: null,
  isLoading: false,
  recipesLoading: false,
  error: null,

  // ── Week navigation ────────────────────────────────────────

  initWeek: async (userId, weekStart) => {
    if (!SUPABASE_CONFIGURED) return
    set({ isLoading: true, error: null, weekStart })
    try {
      const { planId, slots, recipes } = await loadWeekData(userId, weekStart)
      set({ currentPlanId: planId, mealSlots: slots, recipes, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: err.message })
    }
  },

  goToNextWeek: async (userId) => {
    const d = new Date(get().weekStart + 'T00:00:00')
    d.setDate(d.getDate() + 7)
    const next = formatDate(d)
    if (SUPABASE_CONFIGURED && userId) { await get().initWeek(userId, next) }
    else set({ weekStart: next, mealSlots: [], recipes: {} })
  },

  goToPrevWeek: async (userId) => {
    const d = new Date(get().weekStart + 'T00:00:00')
    d.setDate(d.getDate() - 7)
    const prev = formatDate(d)
    if (SUPABASE_CONFIGURED && userId) { await get().initWeek(userId, prev) }
    else set({ weekStart: prev, mealSlots: [], recipes: {} })
  },

  goToCurrentWeek: async (userId) => {
    if (SUPABASE_CONFIGURED && userId) { await get().initWeek(userId, THIS_WEEK) }
    else set({ weekStart: THIS_WEEK, mealSlots: MOCK_SLOTS, recipes: MOCK_RECIPES })
  },

  // ── Recipe library ─────────────────────────────────────────

  loadAllRecipes: async (userId) => {
    if (!SUPABASE_CONFIGURED) return
    set({ recipesLoading: true })
    const { data = [] } = await supabase.from('recipe').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    set({ allRecipes: Object.fromEntries(data.map((r) => [r.id, r])), recipesLoading: false })
  },

  // ── Slot management ────────────────────────────────────────

  addMealSlot: async (day_of_week, meal_type, recipe, userId) => {
    if (!SUPABASE_CONFIGURED) {
      const id = recipe.id || `r_${Date.now()}`
      set((s) => ({
        recipes: { ...s.recipes, [id]: { ...recipe, id } },
        allRecipes: { ...s.allRecipes, [id]: { ...recipe, id } },
        mealSlots: [...s.mealSlots.filter(sl => !(sl.day_of_week === day_of_week && sl.meal_type === meal_type)),
          { id: `s_${Date.now()}`, day_of_week, meal_type, recipe_id: id }],
      }))
      return
    }

    const { currentPlanId } = get()
    if (!currentPlanId || !userId) return
    try {
      const recipePayload = {
        user_id: userId, title: recipe.title, image_url: recipe.image_url ?? null,
        ingredients: recipe.ingredients ?? [], instructions: recipe.instructions ?? null,
        cook_time_mins: recipe.cook_time_mins ?? null, servings: recipe.servings ?? null,
        is_favourite: recipe.is_favourite ?? false, is_recurring: recipe.is_recurring ?? false,
        url: recipe.url ?? null,
      }

      let recipeId = recipe.id
      if (!recipeId || /^(r_|sample_)/.test(recipeId)) {
        const { data: nr, error } = await supabase.from('recipe').insert(recipePayload).select('id').single()
        if (error) throw error
        recipeId = nr.id
      }

      const { data: newSlot, error: sErr } = await supabase
        .from('meal_slot')
        .upsert({ meal_plan_id: currentPlanId, day_of_week, meal_type, recipe_id: recipeId },
          { onConflict: 'meal_plan_id,day_of_week,meal_type' })
        .select('id, day_of_week, meal_type, recipe_id').single()
      if (sErr) throw sErr

      const fullRecipe = { ...recipe, id: recipeId }
      set((s) => ({
        recipes: { ...s.recipes, [recipeId]: fullRecipe },
        allRecipes: { ...s.allRecipes, [recipeId]: fullRecipe },
        mealSlots: [...s.mealSlots.filter(sl => !(sl.day_of_week === day_of_week && sl.meal_type === meal_type)), newSlot],
      }))
    } catch (err) {
      console.error('addMealSlot error:', err)
    }
  },

  removeMealSlot: async (slotId) => {
    if (SUPABASE_CONFIGURED) await supabase.from('meal_slot').delete().eq('id', slotId)
    set((s) => ({ mealSlots: s.mealSlots.filter((sl) => sl.id !== slotId) }))
  },

  // ── Recipe mutations ───────────────────────────────────────

  toggleFavourite: async (recipeId) => {
    const recipe = get().allRecipes[recipeId] || get().recipes[recipeId]
    if (!recipe) return
    const next = !recipe.is_favourite
    if (SUPABASE_CONFIGURED) await supabase.from('recipe').update({ is_favourite: next }).eq('id', recipeId)
    const updated = { ...recipe, is_favourite: next }
    set((s) => ({
      recipes: { ...s.recipes, [recipeId]: updated },
      allRecipes: { ...s.allRecipes, [recipeId]: updated },
    }))
  },

  setRecipeFolder: async (recipeId, folderId) => {
    const recipe = get().allRecipes[recipeId] || get().recipes[recipeId]
    if (!recipe) return
    if (SUPABASE_CONFIGURED) {
      await supabase.from('recipe').update({ folder_id: folderId ?? null }).eq('id', recipeId)
    }
    const updated = { ...recipe, folder_id: folderId ?? null }
    set((s) => ({
      recipes: { ...s.recipes, [recipeId]: updated },
      allRecipes: { ...s.allRecipes, [recipeId]: updated },
    }))
  },

  deleteRecipe: async (recipeId) => {
    if (SUPABASE_CONFIGURED) {
      await supabase.from('recipe').delete().eq('id', recipeId)
    }
    set((s) => {
      const recipes = { ...s.recipes }
      const allRecipes = { ...s.allRecipes }
      delete recipes[recipeId]
      delete allRecipes[recipeId]
      return {
        recipes,
        allRecipes,
        mealSlots: s.mealSlots.filter((sl) => sl.recipe_id !== recipeId),
      }
    })
  },

  setRecurring: async (recipeId, isRecurring, recurrenceRule) => {
    const recipe = get().allRecipes[recipeId] || get().recipes[recipeId]
    if (!recipe) return
    if (SUPABASE_CONFIGURED) {
      await supabase.from('recipe').update({ is_recurring: isRecurring, recurrence_rule: recurrenceRule ?? null }).eq('id', recipeId)
    }
    const updated = { ...recipe, is_recurring: isRecurring, recurrence_rule: recurrenceRule ?? null }
    set((s) => ({
      recipes: { ...s.recipes, [recipeId]: updated },
      allRecipes: { ...s.allRecipes, [recipeId]: updated },
    }))
  },

  // ── Selectors ──────────────────────────────────────────────

  getSlot: (day_of_week, meal_type) => {
    const { mealSlots, recipes } = get()
    const slot = mealSlots.find((s) => s.day_of_week === day_of_week && s.meal_type === meal_type)
    if (!slot) return null
    return { ...slot, recipe: recipes[slot.recipe_id] }
  },

  getWeekIngredients: () => {
    const { mealSlots, recipes } = get()
    const seen = new Set()
    const result = []
    for (const slot of mealSlots) {
      const recipe = recipes[slot.recipe_id]
      if (!recipe?.ingredients?.length || seen.has(recipe.id)) continue
      seen.add(recipe.id)
      result.push({ recipe, ingredients: recipe.ingredients })
    }
    return result
  },
}))
