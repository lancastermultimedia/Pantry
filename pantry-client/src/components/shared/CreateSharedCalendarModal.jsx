import { useState, useRef } from 'react'
import { X, Search, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSocialStore, initials } from '../../store/socialStore'
import { useSharedCalendarStore } from '../../store/sharedCalendarStore'
import { useAuth } from '../../lib/auth'

function getMondayOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekLabel(monday) {
  const opts = { month: 'short', day: 'numeric' }
  const end = new Date(monday)
  end.setDate(end.getDate() + 6)
  return `${monday.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

function toISO(date) {
  return date.toISOString().split('T')[0]
}

export function CreateSharedCalendarModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const { connections, searchResults, searchProfiles, clearSearch } = useSocialStore()
  const { createSharedCalendar } = useSharedCalendarStore()

  const [name, setName] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [peopleQuery, setPeopleQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const searchTimer = useRef(null)

  const monday = getMondayOfWeek(new Date(Date.now() + weekOffset * 7 * 86400000))
  const weekLabel = formatWeekLabel(monday)
  const weekStart = toISO(monday)

  // Filter connections by query
  const filtered = peopleQuery
    ? connections.filter((c) =>
        c.other_user?.display_name.toLowerCase().includes(peopleQuery.toLowerCase()) ||
        c.other_user?.email.toLowerCase().includes(peopleQuery.toLowerCase())
      )
    : connections

  async function handleCreate() {
    const calName = name.trim() || `Shared Week`
    if (!user?.id) return
    setCreating(true)
    setError('')
    try {
      const planId = await createSharedCalendar(user.id, {
        weekStart,
        name: calName,
        inviteeId: selectedPerson?.id ?? null,
      })
      onCreated?.(planId)
      onClose()
    } catch (e) {
      setError(e.message)
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--pantry-border)]">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[var(--pantry-green)]" />
            <h2 className="font-bold text-[var(--pantry-ink)]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              New shared calendar
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--pantry-cream)] text-[var(--pantry-warm-grey)]">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Calendar name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">Calendar name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Our Week, Family Meals…"
              autoFocus
              className="w-full px-4 py-2.5 text-sm bg-[var(--pantry-cream)] border border-[var(--pantry-border)] rounded-xl focus:outline-none focus:border-[var(--pantry-green-light)] text-[var(--pantry-ink)]"
            />
          </div>

          {/* Week picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">Week</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWeekOffset((v) => v - 1)}
                className="w-8 h-8 rounded-lg border border-[var(--pantry-border)] flex items-center justify-center text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-cream)] transition-colors text-sm"
              >
                ‹
              </button>
              <span className="flex-1 text-center text-sm font-medium text-[var(--pantry-ink)]">{weekLabel}</span>
              <button
                onClick={() => setWeekOffset((v) => v + 1)}
                className="w-8 h-8 rounded-lg border border-[var(--pantry-border)] flex items-center justify-center text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-cream)] transition-colors text-sm"
              >
                ›
              </button>
            </div>
          </div>

          {/* Invite a connection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">
              Invite someone (optional)
            </label>
            {selectedPerson ? (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--pantry-green)]/6 rounded-xl border border-[var(--pantry-green)]/20">
                <div className="w-7 h-7 rounded-full bg-[var(--pantry-border)] flex items-center justify-center text-xs font-bold text-[var(--pantry-warm-grey)]">
                  {initials(selectedPerson.display_name)}
                </div>
                <span className="flex-1 text-sm text-[var(--pantry-ink)] font-medium">{selectedPerson.display_name}</span>
                <button onClick={() => setSelectedPerson(null)} className="text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-ink)]">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pantry-warm-grey)]" />
                  <input
                    type="text"
                    value={peopleQuery}
                    onChange={(e) => setPeopleQuery(e.target.value)}
                    placeholder="Search your connections…"
                    className="w-full pl-8 pr-4 py-2 text-sm bg-[var(--pantry-cream)] border border-[var(--pantry-border)] rounded-xl focus:outline-none focus:border-[var(--pantry-green-light)] text-[var(--pantry-ink)]"
                  />
                </div>
                {filtered.length > 0 && (
                  <div className="bg-white border border-[var(--pantry-border)] rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                    {filtered.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedPerson(c.other_user); setPeopleQuery('') }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--pantry-cream)] transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-[var(--pantry-border)] flex items-center justify-center text-xs font-bold text-[var(--pantry-warm-grey)]">
                          {initials(c.other_user?.display_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--pantry-ink)] font-medium truncate">{c.other_user?.display_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {connections.length === 0 && (
                  <p className="text-xs text-[var(--pantry-warm-grey)] px-1">
                    You have no connections yet. <a onClick={() => { }} className="text-[var(--pantry-green)] underline cursor-pointer">Find people →</a>
                  </p>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-[var(--pantry-accent)]">{error}</p>}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--pantry-border)] text-sm text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-cream)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 py-2.5 rounded-xl bg-[var(--pantry-green)] text-white text-sm font-semibold hover:bg-[var(--pantry-green-light)] transition-colors disabled:opacity-40"
          >
            {creating ? 'Creating…' : 'Create calendar'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
