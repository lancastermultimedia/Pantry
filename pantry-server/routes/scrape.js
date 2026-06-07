const express = require('express')
const { parseRecipe } = require('../utils/recipeParser')

const router = express.Router()

router.post('/scrape', async (req, res) => {
  const { url } = req.body

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid url is required' })
  }

  // Reject non-http URLs
  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'URL must start with http:// or https://' })
  }

  try {
    const recipe = await parseRecipe(url)
    res.json(recipe)
  } catch (err) {
    console.error('Scrape error:', err.message)
    res.status(422).json({ error: err.message || 'Could not parse recipe' })
  }
})

module.exports = router
