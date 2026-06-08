import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Leaf, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../lib/auth'
import { useSharedCalendarStore } from '../store/sharedCalendarStore'
import { useMealPlanStore } from '../store/mealPlanStore'
import { useRealtime } from '../lib/useRealtime'
import { initials } from '../store/socialStore'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEALS = ['breakfast', 'lunch', 'dinner']
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

function Avatar({ member }) {
  return (
    <div className="w-7 h-7 rounded-full bg-[var(--pantry-border)] flex items-center justify-center overflow-hidden" title={member.display_name}>
      {member.avatar_url ? (
        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-[var(--pantry-warm-grey)]">{initials(member.display_name)}</span>
      )}
    </div>
  )
}

function SharedMealSlot({ slot, onAdd, onRemove, canEdit }) {
  const recipe = slot?.recipe

  if (!recipe) {
    return (
      <button
        onClick={onAdd}
        disabled={!canEdit}
        className="w-full h-full min-h-[60px] border-2 border-dashed border-[var(--pantry-border)] rounded-xl flex items-center justify-center text-[var(--pantry-warm-grey)] hover:border-[var(--pantry-green)]/40 hover:text-[var(--pantry-green)] hover:bg-[var(--pantry-green)]/4 transition-all disabled:opacity-40 disabled:cursor-default"
      >
        <span className="text-lg">+</span>
      </button>
    )
  }

  return (
    <div className="relative group w-full min-h-[60px] rounded-xl overflow-hidden border border-[var(--pantry-border)] bg-white shadow-sm">
      {recipe.image_url && (
        <div className="h-10 overflow-hidden">
          <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-1.5">
        <p className="text-[11px] font-medium text-[var(--pantry-ink)] leading-tight line-clamp-2">{recipe.title}</p>
        {slot.adder_name && (
          <p className="text-[9px] text-[var(--pantry-warm-grey)] mt-0.5">by {slot.adder_name}</p>
        )}
      </div>
      {canEdit && (
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/50 text-white text-[8px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          ×
        </button>
      )}
    </div>
  )
}

function SharedShoppingPanel({ ingredients, open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl border-l border-[var(--pantry-border)] z-40 flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--pantry-border)]">
            <h2 className="font-bold text-[var(--pantry-ink)] text-sm" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              Shared shopping list
            </h2>
            <button onClick={onClose} className="text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-ink)] text-lg leading-none">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {ingredients.length === 0 ? (
              <p className="text-sm text-[var(--pantry-warm-grey)] text-center py-8">Add recipes to see ingredients here.</p>
            ) : (
              ingredients.map(({ recipe, ingredients: items }) => (
                <div key={recipe.id}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pantry-warm-grey)] mb-1.5">{recipe.title}</p>
                  <ul className="space-y-1">
                    {items.map((ing, i) => (
                      <li key={i} className="text-sm text-[var(--pantry-ink)] flex items-start gap-1.5">
                        <span className="text-[var(--pantry-border)] mt-0.5">—</span>
                        <span>
                          {ing.quantity && <span className="font-medium">{ing.quantity} </span>}
                          {ing.unit && <span className="text-[var(--pantry-warm-grey)]">{ing.unit} </span>}
                          {ing.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function SharedCalendar() {
  const { mealPlanId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { recipes } = useMealPlanStore()

  const {
    currentPlan, currentSlots, currentMembers, loading,
    loadSharedCalendar, addSharedSlot, removeSharedSlot, getSharedSlot, getSharedIngredients, onRealtimeSlot,
  } = useSharedCalendarStore()

  const [showShopping, setShowShopping] = useState(false)
  const [addingSlot, setAddingSlot] = useState(null)

  useEffect(() => {
    loadSharedCalendar(mealPlanId, recipes)
  }, [mealPlanId])

  useRealtime({
    table: 'meal_slot',
    filter: `meal_plan_id=eq.${mealPlanId}`,
    onData: onRealtimeSlot,
  })

  function formatWeekRange(weekStart) {
    if (!weekStart) return ''
    const d = new Date(weekStart + 'T00:00:00')
    const end = new Date(d)
    end.setDate(end.getDate() + 6)
    const opts = { month: 'short', day: 'numeric' }
    return `${d.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
  }

  async function handleAddFromLibrary(day, meal) {
    setAddingSlot({ day, meal })
  }

  async function handleSelectRecipe(recipe) {
    if (!addingSlot || !user?.id) return
    await addSharedSlot(mealPlanId, addingSlot.day, addingSlot.meal, recipe, user.id)
    setAddingSlot(null)
  }

  async function handleRemoveSlot(slot) {
    await removeSharedSlot(slot.id)
  }

  const ingredients = getSharedIngredients()
  const weekLabel = formatWeekRange(currentPlan?.week_start)
  const canEdit = true // all members can edit in shared calendars

  const recipeList = Object.values(recipes)

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--pantry-cream)] flex items-center justify-center">
        <div className="animate-pulse text-[var(--pantry-warm-grey)] text-sm">Loading shared calendar…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--pantry-cream)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--pantry-cream)]/90 backdrop-blur-md border-b border-[var(--pantry-border)] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/shared')}
              className="p-1.5 rounded-lg hover:bg-[var(--pantry-border)] transition-colors text-[var(--pantry-warm-grey)]"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--pantry-green)] flex items-center justify-center">
                <Leaf size={13} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[var(--pantry-ink)] leading-tight" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                  {currentPlan?.name ?? 'Shared Calendar'}
                </h1>
                <p className="text-xs text-[var(--pantry-warm-grey)]">{weekLabel}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Member avatars */}
            {currentMembers.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  {currentMembers.slice(0, 4).map((m) => (
                    <Avatar key={m.user_id} member={m} />
                  ))}
                </div>
                <span className="text-xs text-[var(--pantry-warm-grey)]">{currentMembers.length}</span>
              </div>
            )}
            <button
              onClick={() => setShowShopping((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--pantry-border)] text-xs font-medium text-[var(--pantry-ink)] hover:bg-[var(--pantry-cream)] transition-colors"
            >
              <ShoppingCart size={13} />
              List
            </button>
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="overflow-x-auto px-6 py-6">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)] py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Meal rows */}
          {MEALS.map((meal) => (
            <div key={meal} className="grid grid-cols-8 gap-2 mb-2">
              {/* Row label */}
              <div className="flex items-center justify-end pr-2">
                <span className="text-xs font-medium text-[var(--pantry-warm-grey)] uppercase tracking-wider">{MEAL_LABELS[meal]}</span>
              </div>
              {/* Slots */}
              {DAYS.map((_, dayIdx) => {
                const slot = getSharedSlot(dayIdx, meal)
                return (
                  <SharedMealSlot
                    key={dayIdx}
                    slot={slot}
                    canEdit={canEdit}
                    onAdd={() => handleAddFromLibrary(dayIdx, meal)}
                    onRemove={() => slot && handleRemoveSlot(slot)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Recipe picker overlay */}
      <AnimatePresence>
        {addingSlot && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--pantry-border)]">
                <h3 className="font-semibold text-sm text-[var(--pantry-ink)]">Add a recipe</h3>
                <button onClick={() => setAddingSlot(null)} className="text-[var(--pantry-warm-grey)] text-lg leading-none">×</button>
              </div>
              {recipeList.length === 0 ? (
                <div className="p-6 text-center text-sm text-[var(--pantry-warm-grey)]">
                  No recipes in your library yet. Add some from the planner first.
                </div>
              ) : (
                <ul className="overflow-y-auto divide-y divide-[var(--pantry-border)]">
                  {recipeList.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => handleSelectRecipe(r)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[var(--pantry-cream)] transition-colors text-left"
                      >
                        {r.image_url && (
                          <img src={r.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--pantry-ink)] truncate">{r.title}</p>
                          {r.cook_time_mins && <p className="text-xs text-[var(--pantry-warm-grey)]">{r.cook_time_mins} min</p>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shopping list panel */}
      <SharedShoppingPanel
        ingredients={ingredients}
        open={showShopping}
        onClose={() => setShowShopping(false)}
      />
    </div>
  )
}
