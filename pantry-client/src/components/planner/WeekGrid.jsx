import { AnimatePresence } from 'framer-motion'
import { MealSlot } from './MealSlot'
import { useMealPlanStore } from '../../store/mealPlanStore'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner']
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

function getDayDate(weekStart, dayIndex) {
  const base = new Date(weekStart + 'T00:00:00')
  base.setDate(base.getDate() + dayIndex)
  return base
}

function isToday(date) {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export function WeekGrid() {
  const { weekStart } = useMealPlanStore()

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day header row */}
        <div className="grid gap-px" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
          <div /> {/* empty corner */}
          {DAY_LABELS.map((day, i) => {
            const date = getDayDate(weekStart, i)
            const today = isToday(date)
            return (
              <div
                key={day}
                className={`text-center py-3 px-1 ${today ? 'relative' : ''}`}
              >
                {today && (
                  <div className="absolute inset-x-0 top-0 h-0.5 rounded-full bg-[var(--pantry-accent)]" />
                )}
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    today ? 'text-[var(--pantry-accent)]' : 'text-[var(--pantry-warm-grey)]'
                  }`}
                >
                  {day}
                </p>
                <p
                  className={`text-lg font-bold mt-0.5 leading-none ${
                    today
                      ? 'text-[var(--pantry-accent)]'
                      : 'text-[var(--pantry-ink)]'
                  }`}
                  style={today ? { fontFamily: 'Playfair Display, Georgia, serif' } : {}}
                >
                  {date.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Meal rows */}
        {MEAL_TYPES.map((meal) => (
          <div key={meal} className="grid gap-px border-t border-[var(--pantry-border)]" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
            {/* Row label */}
            <div className="flex items-center justify-center py-2">
              <span
                className="text-[9px] font-semibold uppercase tracking-widest text-[var(--pantry-warm-grey)]"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                {MEAL_LABELS[meal]}
              </span>
            </div>

            {/* Day cells */}
            {DAY_LABELS.map((_, dayIndex) => {
              const date = getDayDate(weekStart, dayIndex)
              const today = isToday(date)
              return (
                <div
                  key={dayIndex}
                  className={`p-2 min-h-[120px] ${
                    today
                      ? 'bg-[var(--pantry-accent)]/4'
                      : 'bg-transparent'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    <MealSlot
                      key={`${dayIndex}-${meal}`}
                      dayIndex={dayIndex}
                      mealType={meal}
                    />
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
