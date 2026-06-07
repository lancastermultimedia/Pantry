import { Modal } from '../ui/Modal'
import { useMealPlanStore } from '../../store/mealPlanStore'
import { useAuth } from '../../lib/auth'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEALS = ['breakfast', 'lunch', 'dinner']
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

export function SlotPickerModal({ isOpen, onClose, recipe }) {
  const { weekStart, getSlot, addMealSlot } = useMealPlanStore()
  const { user } = useAuth()

  const weekDate = new Date(weekStart + 'T00:00:00')

  function handlePick(dayIndex, meal) {
    const existing = getSlot(dayIndex, meal)
    if (existing) return // slot occupied
    addMealSlot(dayIndex, meal, recipe, user?.id)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to this week">
      <div className="space-y-4">
        <p className="text-sm text-[var(--pantry-warm-grey)]">
          Pick a slot to add <span className="font-medium text-[var(--pantry-ink)]">{recipe?.title}</span>
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="w-20" />
                {DAYS.map((day, i) => {
                  const d = new Date(weekDate)
                  d.setDate(d.getDate() + i)
                  return (
                    <th key={day} className="text-center pb-2 font-semibold text-[var(--pantry-warm-grey)] uppercase tracking-wide">
                      <div>{day}</div>
                      <div className="text-[10px] font-normal">{d.getDate()}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {MEALS.map((meal) => (
                <tr key={meal}>
                  <td className="pr-3 py-1 text-[var(--pantry-warm-grey)] font-medium uppercase tracking-wide text-[10px]">
                    {MEAL_LABELS[meal]}
                  </td>
                  {DAYS.map((_, dayIndex) => {
                    const occupied = !!getSlot(dayIndex, meal)
                    return (
                      <td key={dayIndex} className="p-0.5">
                        <button
                          onClick={() => handlePick(dayIndex, meal)}
                          disabled={occupied}
                          className={`w-full h-8 rounded-lg text-xs font-medium transition-colors ${
                            occupied
                              ? 'bg-[var(--pantry-border)] text-[var(--pantry-warm-grey)] cursor-not-allowed opacity-50'
                              : 'bg-[var(--pantry-cream)] border border-dashed border-[var(--pantry-border)] text-[var(--pantry-warm-grey)] hover:border-[var(--pantry-green-light)] hover:bg-[var(--pantry-green)]/5 hover:text-[var(--pantry-green)]'
                          }`}
                        >
                          {occupied ? '●' : '+'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--pantry-warm-grey)]">
          Filled slots (●) are already occupied this week.
        </p>
      </div>
    </Modal>
  )
}
