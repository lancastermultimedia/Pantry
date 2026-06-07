import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Clock, RefreshCw } from 'lucide-react'
import { useMealPlanStore } from '../../store/mealPlanStore'
import { AddRecipeModal } from './AddRecipeModal'

export function MealSlot({ dayIndex, mealType }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { getSlot, removeMealSlot } = useMealPlanStore()

  const slotData = getSlot(dayIndex, mealType)

  if (slotData) {
    const { id: slotId, recipe } = slotData
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative group rounded-xl overflow-hidden border border-[var(--pantry-border)] bg-white cursor-default"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            boxShadow: isHovered
              ? '0 4px 16px rgba(28,28,26,0.10)'
              : '0 1px 3px rgba(28,28,26,0.06)',
            transition: 'box-shadow 0.2s ease',
          }}
        >
          {recipe?.image_url && (
            <div className="relative h-[72px] overflow-hidden">
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}

          <div className="p-2.5">
            <p
              className="text-xs font-semibold text-[var(--pantry-ink)] leading-snug line-clamp-2"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              {recipe?.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              {recipe?.cook_time_mins && (
                <div className="flex items-center gap-1 text-[var(--pantry-warm-grey)]">
                  <Clock size={10} />
                  <span className="text-[10px]">{recipe.cook_time_mins} min</span>
                </div>
              )}
              {recipe?.is_recurring && (
                <span className="flex items-center gap-0.5 text-[10px] text-[var(--pantry-green)] font-medium">
                  <RefreshCw size={9} /> Weekly
                </span>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-black/5 flex items-start justify-end p-1.5"
              >
                <button
                  onClick={() => removeMealSlot(slotId)}
                  className="p-1 rounded-lg bg-white/90 text-[var(--pantry-accent)] hover:bg-white hover:scale-110 transition-all shadow-sm"
                  aria-label="Remove meal"
                >
                  <X size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </>
    )
  }

  return (
    <>
      <motion.button
        onClick={() => setIsModalOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full h-full min-h-[80px] rounded-xl border-2 border-dashed border-[var(--pantry-border)] text-[var(--pantry-warm-grey)] hover:border-[var(--pantry-green-light)] hover:text-[var(--pantry-green)] hover:bg-[var(--pantry-green)]/4 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 group"
      >
        <div className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
          <Plus size={14} />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
          Add
        </span>
      </motion.button>

      <AddRecipeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dayIndex={dayIndex}
        mealType={mealType}
      />
    </>
  )
}
