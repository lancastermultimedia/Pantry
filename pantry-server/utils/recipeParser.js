const axios = require('axios')
const cheerio = require('cheerio')

const SPOONACULAR_BASE = 'https://api.spoonacular.com'

// ── Spoonacular ───────────────────────────────────────────────

async function trySpoonacular(url) {
  const apiKey = process.env.SPOONACULAR_API_KEY
  const { data } = await axios.get(`${SPOONACULAR_BASE}/recipes/extract`, {
    params: { url, apiKey, forceExtraction: true, analyze: true },
    timeout: 12000,
  })

  const ingredients = (data.extendedIngredients || []).map((ing) => ({
    name: ing.nameClean || ing.name || ing.original,
    quantity: ing.amount != null ? String(ing.amount) : '',
    unit: ing.unit || '',
  }))

  let instructions = ''
  if (data.analyzedInstructions?.length) {
    instructions = data.analyzedInstructions[0].steps
      .map((s) => `${s.number}. ${s.step}`)
      .join('\n')
  } else if (data.instructions) {
    instructions = data.instructions.replace(/<[^>]+>/g, ' ').trim()
  }

  return {
    title: data.title,
    image_url: data.image || null,
    ingredients,
    instructions,
    cook_time_mins: data.readyInMinutes || null,
    servings: data.servings || null,
    source_url: url,
  }
}

// ── ld+json fallback ──────────────────────────────────────────

const UNIT_WORDS = [
  'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'tbs',
  'teaspoon', 'teaspoons', 'tsp', 'ounce', 'ounces', 'oz',
  'pound', 'pounds', 'lb', 'lbs', 'gram', 'grams', 'g',
  'kilogram', 'kilograms', 'kg', 'milliliter', 'milliliters', 'ml',
  'liter', 'liters', 'l', 'clove', 'cloves', 'bunch', 'bunches',
  'sprig', 'sprigs', 'slice', 'slices', 'pinch', 'handful', 'can',
]

function parseIngredientString(str) {
  const s = str.trim()
  const unitPat = UNIT_WORDS.join('|')
  // "2 cups flour", "1/2 tsp salt", "3 large eggs"
  const re = new RegExp(
    `^([\\d\\s\\/\\.¼½¾⅓⅔⅛⅜⅝⅞]+)?\\s*(${unitPat})\\.?\\s+(.+)$`,
    'i'
  )
  const m = s.match(re)
  if (m) {
    return {
      quantity: (m[1] || '').trim(),
      unit: (m[2] || '').trim(),
      name: (m[3] || s).trim(),
    }
  }
  // Leading number only: "3 eggs"
  const re2 = /^([\d\s\/\.¼½¾⅓⅔⅛⅜⅝⅞]+)\s+(.+)$/
  const m2 = s.match(re2)
  if (m2) return { quantity: m2[1].trim(), unit: '', name: m2[2].trim() }
  return { quantity: '', unit: '', name: s }
}

function parseDuration(iso) {
  if (!iso) return null
  const m = String(iso).match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) {
    const mins = parseInt(iso)
    return isNaN(mins) ? null : mins
  }
  return (parseInt(m[1] || 0)) * 60 + parseInt(m[2] || 0) || null
}

function extractImage(img) {
  if (!img) return null
  if (typeof img === 'string') return img
  if (Array.isArray(img)) return img[0]?.url || (typeof img[0] === 'string' ? img[0] : null)
  if (img.url) return img.url
  return null
}

function extractServings(yld) {
  if (!yld) return null
  const s = Array.isArray(yld) ? yld[0] : yld
  const m = String(s).match(/\d+/)
  return m ? parseInt(m[0]) : null
}

function extractInstructions(raw) {
  if (!raw) return ''
  if (typeof raw === 'string') return raw.replace(/<[^>]+>/g, '').trim()
  if (Array.isArray(raw)) {
    return raw
      .map((step, i) => {
        const text = typeof step === 'string' ? step : (step.text || '')
        return `${i + 1}. ${text.replace(/<[^>]+>/g, '').trim()}`
      })
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

function findRecipeInLd(json) {
  const candidates = Array.isArray(json)
    ? json
    : json['@graph']
    ? json['@graph']
    : [json]

  for (const obj of candidates) {
    const type = obj['@type']
    if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
      return obj
    }
  }
  return null
}

async function tryLdJson(url) {
  const { data: html } = await axios.get(url, {
    timeout: 12000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  })

  const $ = cheerio.load(html)
  let recipe = null

  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipe) return
    try {
      recipe = findRecipeInLd(JSON.parse($(el).html()))
    } catch {}
  })

  if (!recipe) throw new Error('No Recipe schema found on this page')

  return {
    title: recipe.name,
    image_url: extractImage(recipe.image),
    ingredients: (recipe.recipeIngredient || []).map(parseIngredientString),
    instructions: extractInstructions(recipe.recipeInstructions),
    cook_time_mins: parseDuration(recipe.cookTime || recipe.totalTime),
    servings: extractServings(recipe.recipeYield),
    source_url: url,
  }
}

// ── Public entry point ────────────────────────────────────────

const ERROR_TITLES = /page not found|404|error|access denied|forbidden/i

function isValidRecipe(result) {
  return result?.title && !ERROR_TITLES.test(result.title) && result.ingredients?.length > 0
}

async function parseRecipe(url) {
  try {
    const result = await trySpoonacular(url)
    if (isValidRecipe(result)) return result
    throw new Error('Spoonacular returned invalid data')
  } catch (err) {
    console.warn('Spoonacular failed, trying ld+json fallback:', err.message)
  }

  try {
    const result = await tryLdJson(url)
    if (isValidRecipe(result)) return result
    throw new Error('Recipe data looks invalid')
  } catch (err) {
    throw new Error('Could not parse recipe from this URL. Try a different recipe site.')
  }
}

module.exports = { parseRecipe }
