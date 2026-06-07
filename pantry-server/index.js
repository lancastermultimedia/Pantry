require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const scrapeRouter = require('./routes/scrape')

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
]

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
}))
app.use(express.json())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again in 15 minutes.' },
})

app.use('/api', limiter)
app.use('/api', scrapeRouter)

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'pantry-server' }))

app.listen(PORT, () => {
  console.log(`Pantry server running on http://localhost:${PORT}`)
})
