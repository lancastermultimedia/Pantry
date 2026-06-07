import { estimateCost } from './costEstimator'

// ── Ingredient combination ────────────────────────────────────

const UNIT_NORMALISE = {
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbs: 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp',
  gram: 'g', grams: 'g',
  kilogram: 'kg', kilograms: 'kg',
  milliliter: 'ml', milliliters: 'ml', millilitre: 'ml',
  liter: 'l', liters: 'l', litre: 'l',
  ounce: 'oz', ounces: 'oz',
  pound: 'lb', pounds: 'lb',
  cup: 'cup', cups: 'cup',
}

function normaliseUnit(u) {
  if (!u) return ''
  return UNIT_NORMALISE[u.toLowerCase()] ?? u.toLowerCase()
}

function addQuantities(a, b) {
  const qa = parseFloat(a) || 0
  const qb = parseFloat(b) || 0
  const sum = Math.round((qa + qb) * 1000) / 1000
  return sum > 0 ? String(sum) : ''
}

export function combineIngredients(groups) {
  const map = new Map()

  for (const { ingredients } of groups) {
    for (const ing of ingredients) {
      const key = ing.name.toLowerCase().trim()
      const unit = normaliseUnit(ing.unit)

      if (map.has(key)) {
        const existing = map.get(key)
        if (normaliseUnit(existing.unit) === unit) {
          existing.quantity = addQuantities(existing.quantity, ing.quantity)
        }
        // Different unit — leave the first entry; second is silently merged into first unit
      } else {
        map.set(key, { ...ing, unit, name: ing.name })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

// ── Clipboard copy ────────────────────────────────────────────

export async function copyListToClipboard(groups, view) {
  let lines = []

  if (view === 'combined') {
    const combined = combineIngredients(groups)
    lines = combined.map((ing) =>
      [ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')
    )
  } else {
    for (const { recipe, ingredients } of groups) {
      lines.push(recipe.title)
      for (const ing of ingredients) {
        lines.push('  ' + [ing.quantity, ing.unit, ing.name].filter(Boolean).join(' '))
      }
      lines.push('')
    }
  }

  await navigator.clipboard.writeText(lines.join('\n').trim())
}

// ── Cost per ingredient ───────────────────────────────────────

export function ingredientCost(ing) {
  return estimateCost([ing])
}
