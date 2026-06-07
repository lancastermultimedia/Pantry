import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useMealPlanStore } from '../../store/mealPlanStore'
import { useAuth } from '../../lib/auth'

function formatWeekRange(weekStart) {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const opts = { month: 'long', day: 'numeric' }
  const startStr = start.toLocaleDateString('en-US', opts)
  const endStr = end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })
  return `${startStr} – ${endStr}`
}

function isCurrentWeek(weekStart) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return today >= start && today <= end
}

export function WeekHeader() {
  const { weekStart, goToNextWeek, goToPrevWeek, goToCurrentWeek } = useMealPlanStore()
  const { user } = useAuth()
  const showTodayBtn = !isCurrentWeek(weekStart)

  return (
    <div className="flex items-center justify-between py-5 px-6 border-b border-[var(--pantry-border)]">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--pantry-warm-grey)] font-medium mb-0.5">
          Week of
        </p>
        <h1
          className="text-2xl font-semibold text-[var(--pantry-ink)] leading-tight"
          style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          {formatWeekRange(weekStart)}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {showTodayBtn && (
          <button
            onClick={() => goToCurrentWeek(user?.id)}
            className="flex items-center gap-1.5 text-sm text-[var(--pantry-green)] hover:text-[var(--pantry-green-light)] font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--pantry-green)]/8 transition-all"
          >
            <CalendarDays size={15} />
            This week
          </button>
        )}
        <div className="flex items-center rounded-xl border border-[var(--pantry-border)] overflow-hidden">
          <button
            onClick={() => goToPrevWeek(user?.id)}
            className="p-2 text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-ink)] hover:bg-[var(--pantry-border)] transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="w-px h-5 bg-[var(--pantry-border)]" />
          <button
            onClick={() => goToNextWeek(user?.id)}
            className="p-2 text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-ink)] hover:bg-[var(--pantry-border)] transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
