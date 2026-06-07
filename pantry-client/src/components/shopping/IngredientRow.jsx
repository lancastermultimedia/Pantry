import { motion } from 'framer-motion'
import { ingredientCost } from '../../lib/shoppingList'

export function IngredientRow({ ingredient, checked, onToggle }) {
  const cost = ingredientCost(ingredient)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: checked ? 0.4 : 1, x: 0 }}
      exit={{ opacity: 0, x: -6, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 py-2"
    >
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
          checked
            ? 'bg-[var(--pantry-green)] border-[var(--pantry-green)]'
            : 'border-[var(--pantry-border)] hover:border-[var(--pantry-green-light)]'
        }`}
        aria-label={checked ? 'Uncheck' : 'Check'}
      >
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className={`flex-1 text-xs ${checked ? 'line-through text-[var(--pantry-warm-grey)]' : 'text-[var(--pantry-ink)]'}`}>
        {ingredient.quantity && (
          <span className="text-[var(--pantry-warm-grey)] mr-1">
            {ingredient.quantity}{ingredient.unit ? ` ${ingredient.unit}` : ''}
          </span>
        )}
        {ingredient.name}
      </span>

      {cost > 0 && (
        <span className="text-[10px] text-[var(--pantry-warm-grey)] flex-shrink-0">
          ~${cost.toFixed(2)}
        </span>
      )}
    </motion.li>
  )
}
