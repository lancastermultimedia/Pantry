import { useNavigate } from 'react-router-dom'
import { Calendar, Users } from 'lucide-react'
import { initials } from '../../store/socialStore'

function MemberAvatars({ members, max = 3 }) {
  const shown = members.slice(0, max)
  const extra = members.length - max
  return (
    <div className="flex -space-x-1.5">
      {shown.map((m, i) => (
        <div
          key={m.user_id ?? i}
          className="w-6 h-6 rounded-full border-2 border-white bg-[var(--pantry-border)] flex items-center justify-center overflow-hidden"
          title={m.display_name}
        >
          {m.avatar_url ? (
            <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[9px] font-bold text-[var(--pantry-warm-grey)]">{initials(m.display_name)}</span>
          )}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-6 h-6 rounded-full border-2 border-white bg-[var(--pantry-border)] flex items-center justify-center">
          <span className="text-[9px] font-bold text-[var(--pantry-warm-grey)]">+{extra}</span>
        </div>
      )}
    </div>
  )
}

function formatWeekRange(weekStart) {
  const d = new Date(weekStart + 'T00:00:00')
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  const opts = { month: 'short', day: 'numeric' }
  return `${d.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

export function SharedCalendarCard({ calendar }) {
  const navigate = useNavigate()
  const weekLabel = formatWeekRange(calendar.week_start)
  const isOwner = calendar.role === 'owner'

  return (
    <button
      onClick={() => navigate(`/shared/${calendar.id}`)}
      className="w-full text-left bg-white rounded-2xl border border-[var(--pantry-border)] p-5 hover:border-[var(--pantry-green)]/40 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--pantry-green)]/10 flex items-center justify-center">
            <Calendar size={16} className="text-[var(--pantry-green)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--pantry-ink)] text-sm group-hover:text-[var(--pantry-green)] transition-colors">
              {calendar.name}
            </h3>
            <p className="text-xs text-[var(--pantry-warm-grey)] mt-0.5">{weekLabel}</p>
          </div>
        </div>
        {isOwner && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--pantry-green)]/10 text-[var(--pantry-green)]">
            Owner
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MemberAvatars members={calendar.members ?? []} />
          <span className="text-xs text-[var(--pantry-warm-grey)] flex items-center gap-1">
            <Users size={11} />
            {calendar.members?.length ?? 0} member{calendar.members?.length !== 1 ? 's' : ''}
          </span>
        </div>
        {calendar.meal_count > 0 && (
          <span className="text-xs text-[var(--pantry-warm-grey)]">{calendar.meal_count} meal{calendar.meal_count !== 1 ? 's' : ''}</span>
        )}
      </div>
    </button>
  )
}
