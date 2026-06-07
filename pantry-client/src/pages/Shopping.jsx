import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Copy, Check, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useMealPlanStore } from '../store/mealPlanStore'
import { estimateWeeklyCost } from '../lib/costEstimator'
import { combineIngredients, copyListToClipboard } from '../lib/shoppingList'
import { IngredientRow } from '../components/shopping/IngredientRow'
import { CostSummary } from '../components/shopping/CostSummary'
import { EmptyState } from '../components/ui/EmptyState'

function RecipeSection({ recipe, ingredients, checked, onToggle }) {
  const [open, setOpen] = useState(true)

  const sorted = [...ingredients.map((ing, i) => ({ ing, i }))].sort((a, b) => {
    const ac = checked.has(`${recipe.id}-${a.i}`) ? 1 : 0
    const bc = checked.has(`${recipe.id}-${b.i}`) ? 1 : 0
    return ac - bc
  })

  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-2 group"
      >
        <div className="flex items-center gap-2.5">
          {recipe.image_url && (
            <img src={recipe.image_url} alt="" className="w-9 h-9 rounded-xl object-cover" />
          )}
          <h2
            className="font-semibold text-[var(--pantry-ink)] text-left"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            {recipe.title}
          </h2>
        </div>
        <span className="text-[var(--pantry-warm-grey)] group-hover:text-[var(--pantry-ink)] transition-colors">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
            className="divide-y divide-[var(--pantry-border)] border border-[var(--pantry-border)] rounded-xl bg-white px-4"
          >
            {sorted.map(({ ing, i }) => (
              <IngredientRow
                key={i}
                ingredient={ing}
                checked={checked.has(`${recipe.id}-${i}`)}
                onToggle={() => onToggle(`${recipe.id}-${i}`)}
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  )
}

export function Shopping() {
  const { weekStart, getWeekIngredients } = useMealPlanStore()
  const [view, setView] = useState('recipe')
  const [checked, setChecked] = useState(new Set())
  const [copied, setCopied] = useState(false)

  const groups = getWeekIngredients()
  const combined = combineIngredients(groups)
  const totalCost = estimateWeeklyCost(groups)
  const checkedCount = checked.size

  const start = new Date(weekStart + 'T00:00:00')
  const dateLabel = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const toggleItem = useCallback((key) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  async function handleCopy() {
    await copyListToClipboard(groups, view)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--pantry-green)] flex items-center justify-center flex-shrink-0">
            <ShoppingCart size={18} className="text-white" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-[var(--pantry-ink)]"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Shopping List
            </h1>
            <p className="text-sm text-[var(--pantry-warm-grey)]">Week of {dateLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          {checkedCount > 0 && (
            <button
              onClick={() => setChecked(new Set())}
              className="flex items-center gap-1.5 text-xs text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-accent)] px-3 py-1.5 rounded-lg border border-[var(--pantry-border)] hover:border-[var(--pantry-accent)]/40 transition-colors"
            >
              <Trash2 size={12} /> Clear checked
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--pantry-border)] hover:bg-[var(--pantry-border)] transition-colors text-[var(--pantry-ink)]"
          >
            {copied ? <Check size={12} className="text-[var(--pantry-green)]" /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy list'}
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          type="shopping"
          title="Your shopping list is empty"
          body="Add recipes to your weekly planner and your shopping list will appear here automatically."
        />
      ) : (
        <div className="space-y-6">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-[var(--pantry-border)] overflow-hidden self-start w-fit text-sm font-medium">
            {['recipe', 'combined'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 transition-colors ${
                  view === v
                    ? 'bg-[var(--pantry-green)] text-white'
                    : 'text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-border)]'
                }`}
              >
                {v === 'recipe' ? 'By Recipe' : 'Combined'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {view === 'recipe' ? (
              <motion.div
                key="recipe"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {groups.map(({ recipe, ingredients }) => (
                  <RecipeSection
                    key={recipe.id}
                    recipe={recipe}
                    ingredients={ingredients}
                    checked={checked}
                    onToggle={toggleItem}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="combined"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ul className="divide-y divide-[var(--pantry-border)] border border-[var(--pantry-border)] rounded-xl bg-white px-4">
                  {combined.map((ing, i) => (
                    <IngredientRow
                      key={ing.name}
                      ingredient={ing}
                      checked={checked.has(`combined-${i}`)}
                      onToggle={() => toggleItem(`combined-${i}`)}
                    />
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <CostSummary total={totalCost} />
        </div>
      )}
    </div>
  )
}
