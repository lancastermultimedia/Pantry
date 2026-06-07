import { useState } from 'react'
import { Clock, Users, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function parseSteps(instructions) {
  if (!instructions) return []
  // Split on numbered patterns like "1.", "2.", or newlines
  const byNumber = instructions.split(/\n?\s*\d+\.\s+/).filter(Boolean)
  if (byNumber.length > 1) return byNumber.map((s) => s.trim())
  // Split on newlines as fallback
  const byNewline = instructions.split(/\n+/).filter(Boolean)
  if (byNewline.length > 1) return byNewline.map((s) => s.trim())
  // Last resort — wrap the whole string
  return [instructions.trim()]
}

export function RecipeView({ recipe }) {
  const [checked, setChecked] = useState(new Set())
  const steps = parseSteps(recipe.instructions)

  function toggle(i) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-8 pb-24">
      <Link
        to="/recipes"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-green)] mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Recipe library
      </Link>

      {recipe.image_url && (
        <div className="rounded-2xl overflow-hidden h-56 mb-6 shadow-sm">
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        </div>
      )}

      <h1
        className="text-3xl font-bold text-[var(--pantry-ink)] leading-tight mb-4"
        style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
      >
        {recipe.title}
      </h1>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        {recipe.cook_time_mins && (
          <span className="flex items-center gap-1.5 text-sm text-[var(--pantry-warm-grey)] bg-[var(--pantry-border)] px-3 py-1.5 rounded-full">
            <Clock size={13} /> {recipe.cook_time_mins} min
          </span>
        )}
        {recipe.servings && (
          <span className="flex items-center gap-1.5 text-sm text-[var(--pantry-warm-grey)] bg-[var(--pantry-border)] px-3 py-1.5 rounded-full">
            <Users size={13} /> {recipe.servings} servings
          </span>
        )}
      </div>

      {/* Ingredients */}
      {recipe.ingredients?.length > 0 && (
        <section className="mb-8">
          <h2
            className="text-lg font-semibold text-[var(--pantry-ink)] pb-2 mb-3 border-b border-[var(--pantry-border)]"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            Ingredients
          </h2>
          <ul className="space-y-0 divide-y divide-[var(--pantry-border)]/60">
            {recipe.ingredients.map((ing, i) => (
              <motion.li
                key={i}
                layout
                className={`flex items-center gap-3 py-2.5 transition-opacity ${checked.has(i) ? 'opacity-35' : 'opacity-100'}`}
              >
                <button
                  onClick={() => toggle(i)}
                  className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    checked.has(i)
                      ? 'bg-[var(--pantry-green)] border-[var(--pantry-green)]'
                      : 'border-[var(--pantry-border)] hover:border-[var(--pantry-green-light)]'
                  }`}
                >
                  {checked.has(i) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={`text-sm flex-1 ${checked.has(i) ? 'line-through text-[var(--pantry-warm-grey)]' : 'text-[var(--pantry-ink)]'}`}>
                  {ing.quantity && (
                    <span className="text-[var(--pantry-warm-grey)] mr-1.5">
                      {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                    </span>
                  )}
                  {ing.name}
                </span>
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      {/* Instructions */}
      {steps.length > 0 && (
        <section>
          <h2
            className="text-lg font-semibold text-[var(--pantry-ink)] pb-2 mb-4 border-b border-[var(--pantry-border)]"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            Instructions
          </h2>
          <ol className="space-y-5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span
                  className="w-7 h-7 rounded-full bg-[var(--pantry-green)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  {i + 1}
                </span>
                <p className="text-sm text-[var(--pantry-ink)] leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
