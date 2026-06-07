import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useMealPlanStore } from '../../store/mealPlanStore'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEALS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
]

export function RecurringModal({ isOpen, onClose, recipe }) {
  const { setRecurring } = useMealPlanStore()

  const existingRule = recipe?.recurrence_rule
  const existingParts = existingRule?.split(':') ?? []
  const [selectedDay, setSelectedDay] = useState(existingParts[1] ? parseInt(existingParts[1]) : 0)
  const [selectedMeal, setSelectedMeal] = useState(existingParts[2] ?? 'dinner')
  const [saving, setSaving] = useState(false)

  const isCurrentlyRecurring = !!recipe?.is_recurring

  async function handleSave() {
    if (!recipe) return
    setSaving(true)
    const rule = `weekly:${selectedDay}:${selectedMeal}`
    await setRecurring(recipe.id, true, rule)
    setSaving(false)
    onClose()
  }

  async function handleRemove() {
    if (!recipe) return
    setSaving(true)
    await setRecurring(recipe.id, false, null)
    setSaving(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recurring meal">
      <div className="space-y-5">
        <p className="text-sm text-[var(--pantry-warm-grey)]">
          Schedule <span className="font-medium text-[var(--pantry-ink)]">{recipe?.title}</span> to repeat weekly.
        </p>

        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">Day</label>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day, i) => (
              <button
                key={day}
                onClick={() => setSelectedDay(i)}
                className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedDay === i
                    ? 'bg-[var(--pantry-green)] text-white'
                    : 'bg-[var(--pantry-border)] text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-green)]/10 hover:text-[var(--pantry-green)]'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">Meal</label>
          <div className="flex gap-2">
            {MEALS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSelectedMeal(value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  selectedMeal === value
                    ? 'bg-[var(--pantry-green)] text-white'
                    : 'bg-[var(--pantry-border)] text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-green)]/10 hover:text-[var(--pantry-green)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          {isCurrentlyRecurring && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="text-sm text-[var(--pantry-accent)] hover:underline disabled:opacity-40"
            >
              Remove recurrence
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-[var(--pantry-border)] text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-border)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-xl bg-[var(--pantry-green)] text-white font-medium hover:bg-[var(--pantry-green-light)] transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
