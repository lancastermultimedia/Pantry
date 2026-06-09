import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { SUPABASE_CONFIGURED } from '../lib/auth'
// ── Mock ──────────────────────────────────────────────────────

const MOCK_SHARED_CALENDARS = [
  {
    id: 'sp1',
    name: 'Our Week',
    week_start: '2026-06-08',
    owner_id: 'mock',
    role: 'owner',
    members: [
      { user_id: 'mock', display_name: 'You', avatar_url: null, role: 'owner' },
      { user_id: 'u2', display_name: 'Jamie Oliver', avatar_url: null, role: 'editor' },
    ],
    meal_count: 3,
  },
]

const MOCK_SHARED_SLOTS = [
  { id: 'ss1', day_of_week: 0, meal_type: 'dinner', recipe_id: 'r1',
    added_by: 'mock', adder_name: 'You' },
  { id: 'ss2', day_of_week: 2, meal_type: 'lunch', recipe_id: 'r4',
    added_by: 'u2', adder_name: 'Jamie' },
  { id: 'ss3', day_of_week: 4, meal_type: 'dinner', recipe_id: 'r2',
    added_by: 'mock', adder_name: 'You' },
]

// ── Store ─────────────────────────────────────────────────────

export const useSharedCalendarStore = create((set, get) => ({
  sharedCalendars: SUPABASE_CONFIGURED ? [] : MOCK_SHARED_CALENDARS,
  currentPlan: null,
  currentSlots: SUPABASE_CONFIGURED ? [] : [],
  currentRecipes: {},
  currentMembers: [],
  loading: false,

  // ── List ──────────────────────────────────────────────────

  loadSharedCalendars: async (userId) => {
    if (!SUPABASE_CONFIGURED) return
    const { data: memberships = [] } = await supabase
      .from('meal_plan_members')
      .select('meal_plan_id, role')
      .eq('user_id', userId)

    if (!memberships.length) { set({ sharedCalendars: [] }); return }

    const planIds = memberships.map((m) => m.meal_plan_id)
    const { data: plans = [] } = await supabase
      .from('meal_plan')
      .select('id, user_id, week_start, name')
      .in('id', planIds)

    const roleMap = Object.fromEntries(memberships.map((m) => [m.meal_plan_id, m.role]))

    const { data: allMemberRows = [] } = await supabase
      .from('meal_plan_members')
      .select('meal_plan_id, user_id, role')
      .in('meal_plan_id', planIds)

    const memberUserIds = [...new Set(allMemberRows.map((m) => m.user_id))]
    const { data: memberProfiles = [] } = memberUserIds.length
      ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', memberUserIds)
      : { data: [] }
    const profileMap = Object.fromEntries(memberProfiles.map((p) => [p.id, p]))

    const membersByPlan = {}
    for (const m of allMemberRows) {
      if (!membersByPlan[m.meal_plan_id]) membersByPlan[m.meal_plan_id] = []
      membersByPlan[m.meal_plan_id].push({ ...profileMap[m.user_id], user_id: m.user_id, role: m.role })
    }

    const calendars = plans.map((p) => ({
      ...p,
      role: roleMap[p.id] ?? 'editor',
      members: membersByPlan[p.id] ?? [],
      meal_count: 0,
    }))

    set({ sharedCalendars: calendars })
  },

  // ── Individual calendar ────────────────────────────────────

  loadSharedCalendar: async (planId, mockRecipes = {}) => {
    if (!SUPABASE_CONFIGURED) {
      const plan = MOCK_SHARED_CALENDARS.find((c) => c.id === planId)
      if (!plan) return
      set({ currentPlan: plan, currentSlots: MOCK_SHARED_SLOTS, currentRecipes: mockRecipes, currentMembers: plan.members })
      return
    }

    set({ loading: true })

    const { data: plan } = await supabase
      .from('meal_plan')
      .select('id, user_id, week_start, name')
      .eq('id', planId)
      .single()

    const { data: slots = [] } = await supabase
      .from('meal_slot')
      .select('id, day_of_week, meal_type, recipe_id, added_by')
      .eq('meal_plan_id', planId)

    const recipeIds = [...new Set(slots.map((s) => s.recipe_id))]
    let recipesMap = {}
    if (recipeIds.length) {
      const { data: recipes = [] } = await supabase.from('recipe').select('*').in('id', recipeIds)
      recipesMap = Object.fromEntries(recipes.map((r) => [r.id, r]))
    }

    const { data: memberRows = [] } = await supabase
      .from('meal_plan_members')
      .select('user_id, role')
      .eq('meal_plan_id', planId)

    const calMemberIds = [...new Set(memberRows.map((m) => m.user_id))]
    const { data: calProfiles = [] } = calMemberIds.length
      ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', calMemberIds)
      : { data: [] }
    const calProfileMap = Object.fromEntries(calProfiles.map((p) => [p.id, p]))

    const membersWithProfiles = memberRows.map((m) => ({
      ...calProfileMap[m.user_id],
      user_id: m.user_id,
      role: m.role,
    }))

    set({
      currentPlan: plan,
      currentSlots: slots,
      currentRecipes: recipesMap,
      currentMembers: membersWithProfiles,
      loading: false,
    })
  },

  // ── Create ─────────────────────────────────────────────────

  createSharedCalendar: async (userId, { weekStart, name, inviteeId }) => {
    if (!SUPABASE_CONFIGURED) {
      const mock = {
        id: `sp_${Date.now()}`,
        name: name || 'Shared Calendar',
        week_start: weekStart,
        owner_id: userId,
        role: 'owner',
        members: [{ user_id: userId, display_name: 'You', avatar_url: null, role: 'owner' }],
        meal_count: 0,
      }
      set((s) => ({ sharedCalendars: [...s.sharedCalendars, mock] }))
      return mock.id
    }

    const { data: plan, error } = await supabase
      .from('meal_plan')
      .insert({ user_id: userId, week_start: weekStart, name: name || 'Shared Calendar' })
      .select('id')
      .single()
    if (error) throw error

    // Add owner as member
    await supabase.from('meal_plan_members').insert({ meal_plan_id: plan.id, user_id: userId, role: 'owner' })

    // Invite the other person
    if (inviteeId) {
      await supabase.from('meal_plan_members').insert({
        meal_plan_id: plan.id,
        user_id: inviteeId,
        role: 'editor',
        invited_by: userId,
      })
      // Notification
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', userId).single()
      await supabase.from('notifications').insert({
        user_id: inviteeId,
        type: 'calendar_invite',
        payload: { from_name: profile?.display_name, from_id: userId, calendar_name: name, plan_id: plan.id },
      })
    }

    await get().loadSharedCalendars(userId)
    return plan.id
  },

  // ── Slots ─────────────────────────────────────────────────

  addSharedSlot: async (planId, day_of_week, meal_type, recipe, userId) => {
    if (!SUPABASE_CONFIGURED) {
      const id = recipe.id || `r_${Date.now()}`
      set((s) => ({
        currentRecipes: { ...s.currentRecipes, [id]: { ...recipe, id } },
        currentSlots: [
          ...s.currentSlots.filter((sl) => !(sl.day_of_week === day_of_week && sl.meal_type === meal_type)),
          { id: `ss_${Date.now()}`, day_of_week, meal_type, recipe_id: id, added_by: userId, adder_name: 'You' },
        ],
      }))
      return
    }

    let recipeId = recipe.id
    if (!recipeId || /^(r_|sample_)/.test(recipeId)) {
      const { data: nr } = await supabase.from('recipe').insert({
        user_id: userId, title: recipe.title, image_url: recipe.image_url ?? null,
        ingredients: recipe.ingredients ?? [], instructions: recipe.instructions ?? null,
        cook_time_mins: recipe.cook_time_mins ?? null, servings: recipe.servings ?? null,
      }).select('id').single()
      recipeId = nr?.id
    }

    const { data: slot } = await supabase.from('meal_slot')
      .upsert({ meal_plan_id: planId, day_of_week, meal_type, recipe_id: recipeId, added_by: userId },
        { onConflict: 'meal_plan_id,day_of_week,meal_type' })
      .select('id, day_of_week, meal_type, recipe_id, added_by').single()

    set((s) => ({
      currentRecipes: { ...s.currentRecipes, [recipeId]: { ...recipe, id: recipeId } },
      currentSlots: [
        ...s.currentSlots.filter((sl) => !(sl.day_of_week === day_of_week && sl.meal_type === meal_type)),
        slot,
      ],
    }))
  },

  removeSharedSlot: async (slotId) => {
    if (SUPABASE_CONFIGURED) await supabase.from('meal_slot').delete().eq('id', slotId)
    set((s) => ({ currentSlots: s.currentSlots.filter((sl) => sl.id !== slotId) }))
  },

  onRealtimeSlot: (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    set((s) => {
      let slots = [...s.currentSlots]
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        slots = slots.filter((sl) => sl.id !== newRecord.id)
        slots.push(newRecord)
      } else if (eventType === 'DELETE') {
        slots = slots.filter((sl) => sl.id !== oldRecord.id)
      }
      return { currentSlots: slots }
    })
  },

  // ── Selectors ─────────────────────────────────────────────

  getSharedSlot: (day, meal) => {
    const { currentSlots, currentRecipes } = get()
    const slot = currentSlots.find((s) => s.day_of_week === day && s.meal_type === meal)
    if (!slot) return null
    return { ...slot, recipe: currentRecipes[slot.recipe_id] }
  },

  getSharedIngredients: () => {
    const { currentSlots, currentRecipes } = get()
    const seen = new Set()
    return currentSlots
      .map((s) => currentRecipes[s.recipe_id])
      .filter((r) => r?.ingredients?.length && !seen.has(r.id) && seen.add(r.id))
      .map((r) => ({ recipe: r, ingredients: r.ingredients }))
  },
}))
