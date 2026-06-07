const PRICE_PER_100G = {
  chicken: 0.80,
  beef: 1.20,
  pork: 0.90,
  lamb: 1.50,
  salmon: 2.00,
  tuna: 1.80,
  pasta: 0.15,
  rice: 0.12,
  bread: 0.20,
  oats: 0.10,
  flour: 0.08,
  tomato: 0.30,
  onion: 0.15,
  garlic: 0.40,
  potato: 0.12,
  carrot: 0.18,
  spinach: 0.50,
  lettuce: 0.35,
  avocado: 1.20,
  egg: 0.25,
  milk: 0.10,
  cheese: 1.00,
  butter: 0.80,
  cream: 0.60,
  lemon: 0.30,
  olive_oil: 0.70,
  default: 0.40,
}

const UNIT_TO_GRAMS = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  whole: 100,
  cloves: 5,
  slices: 30,
  bunch: 80,
  sprigs: 5,
}

function matchIngredient(name) {
  const lower = name.toLowerCase()
  for (const [key] of Object.entries(PRICE_PER_100G)) {
    if (lower.includes(key)) return key
  }
  return 'default'
}

export function estimateCost(ingredients) {
  if (!ingredients?.length) return 0
  let total = 0
  for (const ing of ingredients) {
    const grams = (parseFloat(ing.quantity) || 100) * (UNIT_TO_GRAMS[ing.unit] || 100)
    const priceKey = matchIngredient(ing.name)
    const pricePerGram = PRICE_PER_100G[priceKey] / 100
    total += grams * pricePerGram
  }
  return Math.round(total * 100) / 100
}

export function estimateWeeklyCost(recipeGroups) {
  return recipeGroups.reduce((sum, { recipe }) => {
    return sum + estimateCost(recipe.ingredients)
  }, 0)
}
