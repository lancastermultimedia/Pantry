import { useState } from 'react'
import { Heart, Clock, Users, CalendarPlus, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMealPlanStore } from '../../store/mealPlanStore'
import { SlotPickerModal } from './SlotPickerModal'
import { RecurringModal } from './RecurringModal'

export function RecipeCard({ recipe }) {
  const { toggleFavourite } = useMealPlanStore()
  const [slotOpen, setSlotOpen] = useState(false)
  const [recurringOpen, setRecurringOpen] = useState(false)

  return (
    <>
      <div className="rounded-2xl border border-[var(--pantry-border)] bg-white overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
        <Link to={`/recipe/${recipe.id}`} className="block relative h-40 overflow-hidden">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full bg-[var(--pantry-border)]" />
          )}
          {recipe.is_recurring && (
            <span className="absolute top-2 left-2 flex items-center gap-1 bg-[var(--pantry-green)] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <RefreshCw size={9} /> Weekly
            </span>
          )}
        </Link>

        <div className="p-4 flex flex-col flex-1">
          <Link to={`/recipe/${recipe.id}`} className="block mb-2">
            <h3 className="font-semibold text-[var(--pantry-ink)] leading-snug line-clamp-2" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              {recipe.title}
            </h3>
          </Link>

          <div className="flex items-center gap-3 text-xs text-[var(--pantry-warm-grey)] mb-3">
            {recipe.cook_time_mins && (
              <span className="flex items-center gap-1"><Clock size={11} />{recipe.cook_time_mins}m</span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1"><Users size={11} />{recipe.servings}</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-1 mt-auto">
            <button
              onClick={() => setSlotOpen(true)}
              title="Add to this week"
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[var(--pantry-cream)] border border-[var(--pantry-border)] text-[var(--pantry-warm-grey)] hover:border-[var(--pantry-green-light)] hover:text-[var(--pantry-green)] transition-colors"
            >
              <CalendarPlus size={12} /> Add to week
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setRecurringOpen(true)}
                title={recipe.is_recurring ? 'Edit recurrence' : 'Set as recurring'}
                className={`p-1.5 rounded-lg transition-colors ${
                  recipe.is_recurring
                    ? 'text-[var(--pantry-green)]'
                    : 'text-[var(--pantry-border)] hover:text-[var(--pantry-green-light)]'
                }`}
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => toggleFavourite(recipe.id)}
                title={recipe.is_favourite ? 'Remove from favourites' : 'Add to favourites'}
                className={`p-1.5 rounded-lg transition-colors ${
                  recipe.is_favourite ? 'text-[var(--pantry-accent)]' : 'text-[var(--pantry-border)] hover:text-[var(--pantry-accent)]'
                }`}
              >
                <Heart size={14} fill={recipe.is_favourite ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlotPickerModal isOpen={slotOpen} onClose={() => setSlotOpen(false)} recipe={recipe} />
      <RecurringModal isOpen={recurringOpen} onClose={() => setRecurringOpen(false)} recipe={recipe} />
    </>
  )
}
