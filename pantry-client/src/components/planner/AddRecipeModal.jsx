import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, Clock, Users, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { useMealPlanStore } from '../../store/mealPlanStore'
import { useAuth } from '../../lib/auth'
import { estimateCost } from '../../lib/costEstimator'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

// ── Loading skeleton ──────────────────────────────────────────

function PreviewSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--pantry-border)] overflow-hidden bg-white">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <div className="space-y-2 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-3" style={{ width: `${60 + i * 8}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Preview card ──────────────────────────────────────────────

function RecipePreview({ recipe, onConfirm, onReset }) {
  const cost = estimateCost(recipe.ingredients)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="rounded-xl border border-[var(--pantry-border)] overflow-hidden bg-white">
        {recipe.image_url && (
          <div className="relative h-44 overflow-hidden">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <div className="flex items-center gap-2">
                {recipe.cook_time_mins && (
                  <span className="flex items-center gap-1 text-xs text-white/90 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <Clock size={10} /> {recipe.cook_time_mins} min
                  </span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-1 text-xs text-white/90 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <Users size={10} /> {recipe.servings} servings
                  </span>
                )}
                {cost > 0 && (
                  <span className="text-xs text-white/90 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                    ~${cost.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="p-4">
          <h3
            className="font-semibold text-[var(--pantry-ink)] leading-snug mb-3"
            style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1rem' }}
          >
            {recipe.title}
          </h3>

          {recipe.ingredients?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--pantry-warm-grey)] mb-2">
                Ingredients · {recipe.ingredients.length}
              </p>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-xs">
                    <span className="text-[var(--pantry-warm-grey)] flex-shrink-0 min-w-[48px]">
                      {ing.quantity} {ing.unit}
                    </span>
                    <span className="text-[var(--pantry-ink)]">{ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="md" onClick={onReset} className="flex-shrink-0">
          Try another URL
        </Button>
        <Button variant="primary" size="md" onClick={onConfirm} className="flex-1 justify-center">
          <CheckCircle size={15} />
          Add to planner
        </Button>
      </div>
    </motion.div>
  )
}

// ── Error state ───────────────────────────────────────────────

function ErrorState({ message, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[var(--pantry-accent)]/30 bg-[var(--pantry-accent)]/5 p-5 flex flex-col items-center text-center gap-3"
    >
      <AlertCircle size={28} className="text-[var(--pantry-accent)]" />
      <div>
        <p className="font-medium text-[var(--pantry-ink)] text-sm">Couldn't fetch that recipe</p>
        <p className="text-xs text-[var(--pantry-warm-grey)] mt-1">{message}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onReset}>
        Try a different URL
      </Button>
    </motion.div>
  )
}

// ── URL input form ────────────────────────────────────────────

function UrlForm({ onFetch, loading }) {
  const [url, setUrl] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (url.trim()) onFetch(url.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--pantry-warm-grey)] uppercase tracking-wide mb-2">
          Recipe URL
        </label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 border border-[var(--pantry-border)] rounded-xl px-3 py-2.5 bg-white focus-within:border-[var(--pantry-green)] transition-colors">
            <Link size={14} className="text-[var(--pantry-warm-grey)] flex-shrink-0" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.allrecipes.com/recipe/..."
              className="flex-1 text-sm bg-transparent outline-none text-[var(--pantry-ink)] placeholder:text-[var(--pantry-border)]"
              disabled={loading}
              autoFocus
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!url.trim() || loading}
            className="flex-shrink-0"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Fetching
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Fetch <ChevronRight size={14} />
              </span>
            )}
          </Button>
        </div>
        <p className="text-[11px] text-[var(--pantry-warm-grey)] mt-2">
          Works with AllRecipes, NYT Cooking, BBC Good Food, Serious Eats, and most recipe sites.
        </p>
      </div>
    </form>
  )
}

// ── Main modal ────────────────────────────────────────────────

export function AddRecipeModal({ isOpen, onClose, dayIndex, mealType }) {
  const [stage, setStage] = useState('input') // 'input' | 'loading' | 'preview' | 'error'
  const [recipe, setRecipe] = useState(null)
  const [error, setError] = useState('')

  const { addMealSlot } = useMealPlanStore()
  const { user } = useAuth()

  function reset() {
    setStage('input')
    setRecipe(null)
    setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleFetch(url) {
    setStage('loading')
    try {
      const apiBase = import.meta.env.VITE_API_URL ?? ''
      const res = await fetch(`${apiBase}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try another URL.')
        setStage('error')
        return
      }
      setRecipe(data)
      setStage('preview')
    } catch {
      setError('Could not reach the scraping server. Make sure pantry-server is running.')
      setStage('error')
    }
  }

  function handleConfirm() {
    if (!recipe) return
    addMealSlot(dayIndex, mealType, recipe, user?.id)
    handleClose()
  }

  const title = `Add to ${DAY_NAMES[dayIndex]} ${MEAL_LABELS[mealType]}`

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <AnimatePresence mode="wait">
        {stage === 'input' && (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <UrlForm onFetch={handleFetch} loading={false} />
          </motion.div>
        )}

        {stage === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <UrlForm onFetch={handleFetch} loading={true} />
            <div className="mt-4">
              <p className="text-xs text-[var(--pantry-warm-grey)] mb-3">Fetching recipe…</p>
              <PreviewSkeleton />
            </div>
          </motion.div>
        )}

        {stage === 'preview' && recipe && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RecipePreview recipe={recipe} onConfirm={handleConfirm} onReset={reset} />
          </motion.div>
        )}

        {stage === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorState message={error} onReset={reset} />
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
