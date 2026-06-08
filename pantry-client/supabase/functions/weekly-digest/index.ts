// Supabase Edge Function — scheduled weekly digest
// Invoke via a cron job in Supabase Dashboard or pg_cron
// e.g. every Sunday at 18:00 UTC

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const FROM_EMAIL = 'Pantry <digest@pantryapp.email>'

function getMondayOfNextWeek(): string {
  const now = new Date()
  const day = now.getDay()
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + daysUntilMonday)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const nextMonday = getMondayOfNextWeek()

  // Find all users with digest enabled, matching today's digest day
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const { data: profiles = [] } = await supabase
    .from('profiles')
    .select('id, display_name, digest_enabled, digest_send_day')
    .eq('digest_enabled', true)
    .eq('digest_send_day', today)

  let sent = 0
  let failed = 0

  for (const profile of profiles) {
    try {
      // Get their meal plan for next week
      const { data: plan } = await supabase
        .from('meal_plan')
        .select('id')
        .eq('user_id', profile.id)
        .eq('week_start', nextMonday)
        .single()

      if (!plan) continue

      const { data: slots = [] } = await supabase
        .from('meal_slot')
        .select('day_of_week, meal_type, recipe_id')
        .eq('meal_plan_id', plan.id)

      if (!slots.length) continue

      const recipeIds = [...new Set(slots.map((s) => s.recipe_id))]
      const { data: recipes = [] } = await supabase
        .from('recipe')
        .select('id, title, cook_time_mins, ingredients')
        .in('id', recipeIds)

      const recipeMap = Object.fromEntries(recipes.map((r) => [r.id, r]))

      // Build day-by-day summary
      const byDay: Record<number, { meal: string; title: string }[]> = {}
      for (const slot of slots) {
        if (!byDay[slot.day_of_week]) byDay[slot.day_of_week] = []
        const recipe = recipeMap[slot.recipe_id]
        if (recipe) {
          byDay[slot.day_of_week].push({ meal: slot.meal_type, title: recipe.title })
        }
      }

      const dayRows = Object.keys(byDay)
        .sort((a, b) => Number(a) - Number(b))
        .map((d) => {
          const meals = byDay[Number(d)].map((m) => `<li>${m.meal}: <strong>${m.title}</strong></li>`).join('')
          return `<tr><td style="padding: 8px 12px; font-weight: bold; color: #2D5016; vertical-align: top;">${DAY_NAMES[Number(d)]}</td><td style="padding: 8px 12px;"><ul style="margin:0;padding:0;list-style:none;">${meals}</ul></td></tr>`
        })
        .join('')

      // Aggregate all ingredients
      const ingredientSet: Record<string, string> = {}
      for (const slot of slots) {
        const recipe = recipeMap[slot.recipe_id]
        if (!recipe?.ingredients) continue
        for (const ing of recipe.ingredients) {
          const key = ing.name?.toLowerCase()
          if (key && !ingredientSet[key]) {
            ingredientSet[key] = `${ing.quantity ?? ''} ${ing.unit ?? ''} ${ing.name}`.trim()
          }
        }
      }

      const ingredientRows = Object.values(ingredientSet)
        .map((i) => `<li style="padding: 4px 0; border-bottom: 1px solid #E8E2D9;">${i}</li>`)
        .join('')

      const weekLabel = `${formatDate(nextMonday)} – ${formatDate(
        new Date(new Date(nextMonday + 'T00:00:00').getTime() + 6 * 86400000).toISOString().split('T')[0]
      )}`

      // Get user email
      const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(profile.id)
      if (userErr || !user?.email) continue

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: user.email,
          subject: `Your Pantry week ahead: ${weekLabel}`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1C1C1A; background: #FAF7F2; padding: 24px;">
              <div style="margin-bottom: 24px;">
                <span style="font-size: 22px; font-weight: bold; color: #2D5016;">🌿 Pantry</span>
                <p style="color: #8C8478; font-size: 14px; margin-top: 4px;">Weekly meal plan digest</p>
              </div>

              <h2 style="font-size: 18px; margin-bottom: 16px;">Your week ahead — ${weekLabel}</h2>

              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #E8E2D9; margin-bottom: 24px;">
                ${dayRows}
              </table>

              <h3 style="font-size: 15px; margin-bottom: 12px; color: #2D5016;">🛒 Shopping list</h3>
              <ul style="background: white; border: 1px solid #E8E2D9; border-radius: 12px; padding: 12px 20px; margin-bottom: 24px;">
                ${ingredientRows || '<li style="color: #8C8478;">No ingredients found</li>'}
              </ul>

              <div style="font-size: 12px; color: #8C8478; border-top: 1px solid #E8E2D9; padding-top: 16px;">
                Manage your digest settings in <a href="https://pantry.app/settings" style="color: #2D5016;">Pantry Settings</a>.
              </div>
            </div>
          `,
        }),
      })

      if (emailRes.ok) sent++ else failed++
    } catch (e) {
      console.error(`Failed for user ${profile.id}:`, e)
      failed++
    }
  }

  return new Response(
    JSON.stringify({ sent, failed, total: profiles.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
