import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useSocialStore, getNotificationText } from '../../store/socialStore'
import { useAuth } from '../../lib/auth'
import { useRealtime } from '../../lib/useRealtime'

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotificationIcon({ type }) {
  const map = {
    shared_pantry_request: '🤝',
    shared_pantry_accepted: '✅',
    calendar_invite: '📅',
    folder_invite: '📁',
    recipe_added_to_calendar: '🍽️',
    recipe_added_to_folder: '📖',
  }
  return <span className="text-base">{map[type] ?? '🔔'}</span>
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifications, unreadCount, loadNotifications, markRead, markAllRead, addNotification } = useSocialStore()

  useEffect(() => {
    if (user?.id) loadNotifications(user.id)
  }, [user?.id])

  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Real-time new notifications
  useRealtime({
    table: 'notifications',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onData: (payload) => {
      if (payload.eventType === 'INSERT') addNotification(payload.new)
    },
  })

  async function handleClick(n) {
    if (!n.read) await markRead(user?.id, n.id)
    const { link } = getNotificationText(n)
    setOpen(false)
    navigate(link)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-lg text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-ink)] hover:bg-[var(--pantry-border)] transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--pantry-accent)] text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-9 w-80 bg-white rounded-2xl shadow-2xl border border-[var(--pantry-border)] overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--pantry-border)]">
              <span className="font-semibold text-sm text-[var(--pantry-ink)]">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead(user?.id)}
                  className="text-xs text-[var(--pantry-green)] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-[var(--pantry-warm-grey)]">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--pantry-border)] max-h-80 overflow-y-auto">
                {notifications.map((n) => {
                  const { text } = getNotificationText(n)
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => handleClick(n)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[var(--pantry-cream)] transition-colors ${!n.read ? 'bg-[var(--pantry-green)]/4' : ''}`}
                      >
                        <NotificationIcon type={n.type} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${n.read ? 'text-[var(--pantry-warm-grey)]' : 'text-[var(--pantry-ink)] font-medium'}`}>
                            {text}
                          </p>
                          <p className="text-[10px] text-[var(--pantry-warm-grey)] mt-0.5">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--pantry-green)] flex-shrink-0 mt-1" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
