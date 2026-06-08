import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, UserPlus, UserCheck, UserX, Leaf, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../lib/auth'
import { useSocialStore, initials } from '../store/socialStore'

function Avatar({ user, size = 10 }) {
  const sz = `w-${size} h-${size}`
  return (
    <div className={`${sz} rounded-full overflow-hidden bg-[var(--pantry-border)] flex items-center justify-center flex-shrink-0`}>
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-[var(--pantry-warm-grey)]">{initials(user?.display_name)}</span>
      )}
    </div>
  )
}

function ConnectionCard({ connection, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--pantry-border)] last:border-0">
      <Avatar user={connection.other_user} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--pantry-ink)] truncate">{connection.other_user?.display_name}</p>
        <p className="text-xs text-[var(--pantry-warm-grey)] truncate">{connection.other_user?.email}</p>
      </div>
      <button
        onClick={() => onRemove(connection.id)}
        className="p-1.5 rounded-lg text-[var(--pantry-warm-grey)] hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Remove connection"
      >
        <UserX size={15} />
      </button>
    </div>
  )
}

function RequestCard({ request, onAccept, onDecline, variant }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--pantry-border)] last:border-0">
      <Avatar user={request.other_user} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--pantry-ink)] truncate">{request.other_user?.display_name}</p>
        <p className="text-xs text-[var(--pantry-warm-grey)] truncate">{request.other_user?.email}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {variant === 'incoming' ? (
          <>
            <button
              onClick={() => onAccept(request.id)}
              className="p-1.5 rounded-lg text-[var(--pantry-green)] hover:bg-[var(--pantry-green)]/10 transition-colors"
              title="Accept"
            >
              <UserCheck size={15} />
            </button>
            <button
              onClick={() => onDecline(request.id)}
              className="p-1.5 rounded-lg text-[var(--pantry-warm-grey)] hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Decline"
            >
              <X size={15} />
            </button>
          </>
        ) : (
          <button
            onClick={() => onDecline(request.id)}
            className="text-xs text-[var(--pantry-warm-grey)] hover:text-red-500 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export default function People() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    connections, pendingIncoming, pendingOutgoing, searchResults,
    loadConnections, searchProfiles, clearSearch, sendPantryRequest,
    respondToRequest, cancelRequest, removeConnection,
  } = useSocialStore()

  const [tab, setTab] = useState('connections')
  const [query, setQuery] = useState('')
  const [requestingId, setRequestingId] = useState(null)
  const searchTimer = useRef(null)

  useEffect(() => {
    if (user?.id) loadConnections(user.id)
    return () => clearSearch()
  }, [user?.id])

  function handleSearchChange(value) {
    setQuery(value)
    clearTimeout(searchTimer.current)
    if (!value.trim()) { clearSearch(); return }
    searchTimer.current = setTimeout(() => searchProfiles(value), 300)
  }

  async function handleSendRequest(toId) {
    if (!user?.id) return
    setRequestingId(toId)
    await sendPantryRequest(user.id, toId)
    setRequestingId(null)
    setQuery('')
    clearSearch()
  }

  async function handleAccept(requestId) {
    await respondToRequest(user?.id, requestId, true)
  }
  async function handleDecline(requestId) {
    await respondToRequest(user?.id, requestId, false)
  }
  async function handleCancel(requestId) {
    await cancelRequest(user?.id, requestId)
  }
  async function handleRemove(connectionId) {
    if (!confirm('Remove this connection?')) return
    await removeConnection(user?.id, connectionId)
  }

  const connectedIds = new Set([
    ...connections.map((c) => c.other_user?.id),
    ...pendingOutgoing.map((c) => c.other_user?.id),
    ...pendingIncoming.map((c) => c.other_user?.id),
    user?.id,
  ])

  const pendingCount = pendingIncoming.length

  return (
    <div className="min-h-screen bg-[var(--pantry-cream)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--pantry-cream)]/90 backdrop-blur-md border-b border-[var(--pantry-border)] px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-[var(--pantry-border)] transition-colors text-[var(--pantry-warm-grey)]"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--pantry-green)] flex items-center justify-center">
            <Leaf size={13} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-[var(--pantry-ink)]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            People
          </h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-6 space-y-6">

        {/* Search */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pantry-warm-grey)]">Find people</p>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--pantry-warm-grey)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[var(--pantry-border)] rounded-xl focus:outline-none focus:border-[var(--pantry-green-light)] text-[var(--pantry-ink)]"
            />
          </div>

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="bg-white rounded-xl border border-[var(--pantry-border)] overflow-hidden shadow-sm"
              >
                {searchResults.map((person) => {
                  const isConnected = connectedIds.has(person.id)
                  return (
                    <div key={person.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--pantry-border)] last:border-0">
                      <Avatar user={person} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--pantry-ink)] truncate">{person.display_name}</p>
                        <p className="text-xs text-[var(--pantry-warm-grey)] truncate">{person.email}</p>
                      </div>
                      {!isConnected && (
                        <button
                          onClick={() => handleSendRequest(person.id)}
                          disabled={requestingId === person.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--pantry-green)] text-white text-xs font-semibold hover:bg-[var(--pantry-green-light)] transition-colors disabled:opacity-40"
                        >
                          <UserPlus size={12} />
                          Connect
                        </button>
                      )}
                      {isConnected && (
                        <span className="flex items-center gap-1 text-xs text-[var(--pantry-green)] font-medium">
                          <UserCheck size={13} />
                          Connected
                        </span>
                      )}
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--pantry-border)] p-1 rounded-xl">
          {[
            { key: 'connections', label: `Connections${connections.length ? ` (${connections.length})` : ''}` },
            { key: 'incoming', label: `Requests${pendingCount ? ` (${pendingCount})` : ''}` },
            { key: 'outgoing', label: 'Sent' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t.key ? 'bg-white text-[var(--pantry-ink)] shadow-sm' : 'text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-ink)]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-[var(--pantry-border)] p-4">
          {tab === 'connections' && (
            <>
              {connections.length === 0 ? (
                <EmptyState icon="🤝" text="No connections yet" sub="Search for people above to connect with them" />
              ) : (
                connections.map((c) => (
                  <ConnectionCard key={c.id} connection={c} onRemove={handleRemove} />
                ))
              )}
            </>
          )}
          {tab === 'incoming' && (
            <>
              {pendingIncoming.length === 0 ? (
                <EmptyState icon="📬" text="No pending requests" sub="When someone sends you a request, it'll appear here" />
              ) : (
                pendingIncoming.map((r) => (
                  <RequestCard key={r.id} request={r} variant="incoming" onAccept={handleAccept} onDecline={handleDecline} />
                ))
              )}
            </>
          )}
          {tab === 'outgoing' && (
            <>
              {pendingOutgoing.length === 0 ? (
                <EmptyState icon="📤" text="No sent requests" sub="Requests you send will appear here" />
              ) : (
                pendingOutgoing.map((r) => (
                  <RequestCard key={r.id} request={r} variant="outgoing" onDecline={handleCancel} />
                ))
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}

function EmptyState({ icon, text, sub }) {
  return (
    <div className="py-10 text-center">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-sm font-medium text-[var(--pantry-ink)]">{text}</p>
      <p className="text-xs text-[var(--pantry-warm-grey)] mt-1">{sub}</p>
    </div>
  )
}
