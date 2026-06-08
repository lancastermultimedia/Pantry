import { useState } from 'react'
import { X, FolderOpen, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSocialStore, initials } from '../../store/socialStore'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { SUPABASE_CONFIGURED } from '../../lib/auth'

export function ShareFolderModal({ folder, onClose }) {
  const { user } = useAuth()
  const { connections, profile } = useSocialStore()
  const [selectedId, setSelectedId] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [error, setError] = useState('')

  async function handleShare() {
    if (!selectedId || !user?.id) return
    setSharing(true)
    setError('')
    try {
      if (SUPABASE_CONFIGURED) {
        await supabase.from('folder_members').insert({
          folder_id: folder.id,
          user_id: selectedId,
          invited_by: user.id,
          role: 'viewer',
        })
        const { data: toProfile } = await supabase.from('profiles').select('display_name').eq('id', selectedId).single()
        await supabase.from('notifications').insert({
          user_id: selectedId,
          type: 'folder_invite',
          payload: {
            from_name: profile?.display_name ?? 'Someone',
            from_id: user.id,
            folder_name: folder.name,
            folder_id: folder.id,
          },
        })
      }
      setShared(true)
      setTimeout(onClose, 1200)
    } catch (e) {
      setError(e.message)
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--pantry-border)]">
          <div className="flex items-center gap-2">
            <FolderOpen size={15} className="text-[var(--pantry-green)]" />
            <h2 className="font-bold text-sm text-[var(--pantry-ink)]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              Share "{folder?.name}"
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--pantry-cream)] text-[var(--pantry-warm-grey)]">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4">
          {connections.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-2xl mb-2">🤝</p>
              <p className="text-sm text-[var(--pantry-warm-grey)]">No connections yet.</p>
              <p className="text-xs text-[var(--pantry-warm-grey)] mt-1">Connect with people in the People tab first.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pantry-warm-grey)] mb-2">Share with</p>
              {connections.map((c) => {
                const person = c.other_user
                const sel = selectedId === person?.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(sel ? null : person?.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${sel ? 'bg-[var(--pantry-green)]/8 border border-[var(--pantry-green)]/20' : 'hover:bg-[var(--pantry-cream)]'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--pantry-border)] flex items-center justify-center text-xs font-bold text-[var(--pantry-warm-grey)] flex-shrink-0">
                      {person?.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        initials(person?.display_name)
                      )}
                    </div>
                    <span className="flex-1 text-sm text-left font-medium text-[var(--pantry-ink)]">{person?.display_name}</span>
                    {sel && <Check size={14} className="text-[var(--pantry-green)]" />}
                  </button>
                )
              })}
            </div>
          )}
          {error && <p className="text-xs text-[var(--pantry-accent)] mt-2">{error}</p>}
        </div>

        {connections.length > 0 && (
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--pantry-border)] text-sm text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-cream)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={!selectedId || sharing || shared}
              className="flex-1 py-2.5 rounded-xl bg-[var(--pantry-green)] text-white text-sm font-semibold hover:bg-[var(--pantry-green-light)] transition-colors disabled:opacity-40"
            >
              {shared ? '✓ Shared' : sharing ? 'Sharing…' : 'Share folder'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
