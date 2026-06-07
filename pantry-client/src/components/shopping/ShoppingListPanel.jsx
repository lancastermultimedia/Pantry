import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ChevronDown, ChevronRight, Copy, Check, Trash2 } from 'lucide-react'
import { useMealPlanStore } from '../../store/mealPlanStore'
import { estimateWeeklyCost } from '../../lib/costEstimator'
import { combineIngredients, copyListToClipboard } from '../../lib/shoppingList'
import { IngredientRow } from './IngredientRow'
import { CostSummary } from './CostSummary'

// ── Recipe section (by-recipe view) ──────────────────────────

function RecipeSection({ recipe, ingredients, checked, onToggle }) {
  const [open, setOpen] = useState(true)
  const allChecked = ingredients.every((_, i) => checked.has(`${recipe.id}-${i}`))

  return (
    <div className="border border-[var(--pantry-border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-[var(--pantry-cream)] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {recipe.image_url && (
            <img src={recipe.image_url} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
          )}
          <span
            className={`text-xs font-semibold truncate ${allChecked ? 'line-through text-[var(--pantry-warm-grey)]' : 'text-[var(--pantry-ink)]'}`}
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            {recipe.title}
          </span>
        </div>
        <span className="text-[var(--pantry-warm-grey)] flex-shrink-0 ml-2">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <ul className="px-3 divide-y divide-[var(--pantry-border)]/50 bg-[var(--pantry-cream)]/40">
              {/* Unchecked first, checked last */}
              {[...ingredients.map((ing, i) => ({ ing, i }))].sort((a, b) => {
                const ac = checked.has(`${recipe.id}-${a.i}`) ? 1 : 0
                const bc = checked.has(`${recipe.id}-${b.i}`) ? 1 : 0
                return ac - bc
              }).map(({ ing, i }) => (
                <IngredientRow
                  key={i}
                  ingredient={ing}
                  checked={checked.has(`${recipe.id}-${i}`)}
                  onToggle={() => onToggle(`${recipe.id}-${i}`)}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Combined view ─────────────────────────────────────────────

function CombinedList({ ingredients, checked, onToggle }) {
  const unchecked = ingredients.filter((_, i) => !checked.has(`combined-${i}`))
  const checkedItems = ingredients.filter((_, i) => checked.has(`combined-${i}`))
  const sorted = [...unchecked, ...checkedItems]

  return (
    <div className="border border-[var(--pantry-border)] rounded-xl overflow-hidden bg-white">
      <ul className="px-3 divide-y divide-[var(--pantry-border)]/50">
        <AnimatePresence>
          {sorted.map((ing, sortedIdx) => {
            const origIdx = ingredients.indexOf(ing)
            const key = `combined-${origIdx}`
            return (
              <IngredientRow
                key={ing.name}
                ingredient={ing}
                checked={checked.has(key)}
                onToggle={() => onToggle(key)}
              />
            )
          })}
        </AnimatePresence>
      </ul>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────

export function ShoppingListPanel() {
  const { weekStart, getWeekIngredients } = useMealPlanStore()
  const [view, setView] = useState('recipe') // 'recipe' | 'combined'
  const [checked, setChecked] = useState(new Set())
  const [copied, setCopied] = useState(false)

  const groups = getWeekIngredients()
  const combined = combineIngredients(groups)
  const totalCost = estimateWeeklyCost(groups)
  const checkedCount = checked.size

  const start = new Date(weekStart + 'T00:00:00')
  const dateLabel = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

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

  function handleClearChecked() {
    setChecked(new Set())
  }

  return (
    <aside className="w-72 flex-shrink-0 border-l border-[var(--pantry-border)] flex flex-col bg-[var(--pantry-cream)] h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--pantry-border)] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-[var(--pantry-green)] flex items-center justify-center flex-shrink-0">
          <ShoppingCart size={13} className="text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[var(--pantry-ink)] leading-tight">Shopping List</h2>
          <p className="text-[10px] text-[var(--pantry-warm-grey)]">Week of {dateLabel}</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-5">
          <div className="w-11 h-11 rounded-full bg-[var(--pantry-border)] flex items-center justify-center mb-3">
            <ShoppingCart size={18} className="text-[var(--pantry-warm-grey)]" />
          </div>
          <p className="text-sm font-medium text-[var(--pantry-ink)]">No ingredients yet</p>
          <p className="text-xs text-[var(--pantry-warm-grey)] mt-1 leading-relaxed">
            Add recipes to your planner and your shopping list will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="px-4 py-2 border-b border-[var(--pantry-border)] flex items-center justify-between gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-[var(--pantry-border)] overflow-hidden text-[10px] font-semibold">
              {['recipe', 'combined'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-2.5 py-1 uppercase tracking-wide transition-colors ${
                    view === v
                      ? 'bg-[var(--pantry-green)] text-white'
                      : 'text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-border)]'
                  }`}
                >
                  {v === 'recipe' ? 'By Recipe' : 'Combined'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {checkedCount > 0 && (
                <button
                  onClick={handleClearChecked}
                  title="Clear checked items"
                  className="p-1.5 rounded-lg text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-accent)] hover:bg-[var(--pantry-border)] transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                onClick={handleCopy}
                title="Copy list"
                className="p-1.5 rounded-lg text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-green)] hover:bg-[var(--pantry-border)] transition-colors"
              >
                {copied ? <Check size={13} className="text-[var(--pantry-green)]" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence>
              {view === 'recipe' ? (
                groups.map(({ recipe, ingredients }) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RecipeSection
                      recipe={recipe}
                      ingredients={ingredients}
                      checked={checked}
                      onToggle={toggleItem}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="combined"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CombinedList
                    ingredients={combined}
                    checked={checked}
                    onToggle={toggleItem}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cost footer */}
          <div className="border-t border-[var(--pantry-border)] px-4 py-3 bg-white">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-[var(--pantry-warm-grey)]">Est. weekly total</span>
              <span
                className="text-lg font-bold text-[var(--pantry-ink)]"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                ${totalCost.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-[var(--pantry-warm-grey)]">
              ~${(totalCost / 7).toFixed(2)}/day · avg US grocery prices
            </p>
          </div>
        </>
      )}
    </aside>
  )
}
