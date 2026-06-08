const express = require('express')
const { parseRecipe } = require('../utils/recipeParser')
const dns = require('dns').promises

const router = express.Router()

// Private/reserved IP ranges to block (SSRF protection)
const PRIVATE_RANGES = [
  /^127\./,                          // loopback
  /^10\./,                           // RFC1918
  /^172\.(1[6-9]|2\d|3[01])\./,     // RFC1918
  /^192\.168\./,                     // RFC1918
  /^169\.254\./,                     // link-local / AWS metadata
  /^::1$/,                           // IPv6 loopback
  /^fc00:/i,                         // IPv6 private
  /^fe80:/i,                         // IPv6 link-local
  /^0\./,                            // this-network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // RFC6598 shared address
]

async function isSafeUrl(rawUrl) {
  let parsed
  try { parsed = new URL(rawUrl) } catch { return false }

  if (!['http:', 'https:'].includes(parsed.protocol)) return false
  if (rawUrl.length > 2000) return false

  const hostname = parsed.hostname
  // Block numeric IPs directly
  if (/^[\d.]+$/.test(hostname) || hostname.includes(':')) {
    return !PRIVATE_RANGES.some(re => re.test(hostname))
  }

  // Resolve hostname and check all returned IPs
  try {
    const { address } = await dns.lookup(hostname)
    if (PRIVATE_RANGES.some(re => re.test(address))) return false
  } catch {
    return false // unresolvable hostname
  }

  return true
}

router.post('/scrape', async (req, res) => {
  const { url } = req.body

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid url is required' })
  }

  if (!(await isSafeUrl(url))) {
    return res.status(400).json({ error: 'URL is not allowed' })
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
