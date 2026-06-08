import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Leaf } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../lib/auth'
import { useSharedCalendarStore } from '../store/sharedCalendarStore'
import { SharedCalendarCard } from '../components/shared/SharedCalendarCard'
import { CreateSharedCalendarModal } from '../components/shared/CreateSharedCalendarModal'

export default function Shared() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { sharedCalendars, loadSharedCalendars } = useSharedCalendarStore()
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (user?.id) loadSharedCalendars(user.id)
  }, [user?.id])

  function handleCreated(planId) {
    if (planId) navigate(`/shared/${planId}`)
  }

  return (
    <div className="min-h-screen bg-[var(--pantry-cream)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--pantry-cream)]/90 backdrop-blur-md border-b border-[var(--pantry-border)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/planner')}
            className="p-1.5 rounded-lg hover:bg-[var(--pantry-border)] transition-colors text-[var(--pantry-warm-grey)]"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--pantry-green)] flex items-center justify-center">
              <Leaf size={13} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-[var(--pantry-ink)]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              Shared calendars
            </h1>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--pantry-green)] text-white text-sm font-semibold hover:bg-[var(--pantry-green-light)] transition-colors"
        >
          <Plus size={14} />
          New
        </button>
      </header>

      <div className="max-w-xl mx-auto px-6 py-6">
        {sharedCalendars.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📅</p>
            <h2 className="text-xl font-bold text-[var(--pantry-ink)] mb-2" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              No shared calendars yet
            </h2>
            <p className="text-sm text-[var(--pantry-warm-grey)] mb-6 max-w-xs mx-auto">
              Create a shared calendar and invite a connection to plan meals together in real time.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--pantry-green)] text-white font-semibold hover:bg-[var(--pantry-green-light)] transition-colors"
            >
              <Plus size={16} />
              Create your first shared calendar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sharedCalendars.map((cal) => (
              <SharedCalendarCard key={cal.id} calendar={cal} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateSharedCalendarModal
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
