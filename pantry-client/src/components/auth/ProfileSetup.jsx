import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Upload } from 'lucide-react'
import { useSocialStore } from '../../store/socialStore'

export function ProfileSetup({ userId, onComplete }) {
  const { upsertProfile, uploadAvatar } = useSocialStore()
  const [displayName, setDisplayName] = useState('')
  const [searchable, setSearchable] = useState(true)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleAvatarPick(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    const name = displayName.trim()
    if (!name) { setError('Please enter your name.'); return }
    setSaving(true)
    try {
      let avatarUrl = null
      if (avatarFile) {
        try { avatarUrl = await uploadAvatar(userId, avatarFile) } catch {}
      }
      await upsertProfile(userId, {
        display_name: name,
        is_searchable: searchable,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      onComplete()
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--pantry-cream)] z-[90] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[var(--pantry-green)] flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-[var(--pantry-ink)]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Pantry
          </span>
        </div>

        <h1 className="text-3xl font-bold text-[var(--pantry-ink)] mb-2" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
          Set up your Pantry
        </h1>
        <p className="text-[var(--pantry-warm-grey)] text-sm mb-8">
          Just a few details and you're ready to start planning.
        </p>

        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[var(--pantry-border)] flex items-center justify-center flex-shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-[var(--pantry-warm-grey)]">
                  {displayName ? displayName[0].toUpperCase() : '?'}
                </span>
              )}
            </div>
            <label className="cursor-pointer flex items-center gap-2 text-sm text-[var(--pantry-green)] hover:underline">
              <Upload size={14} />
              {avatarFile ? 'Change photo' : 'Upload photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
            </label>
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">
              Your name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="How other Pantry users will see you"
              autoFocus
              className="w-full px-4 py-3 text-sm bg-white border border-[var(--pantry-border)] rounded-xl focus:outline-none focus:border-[var(--pantry-green-light)] text-[var(--pantry-ink)]"
            />
            {error && <p className="text-xs text-[var(--pantry-accent)]">{error}</p>}
          </div>

          {/* Searchability */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setSearchable((v) => !v)}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${searchable ? 'bg-[var(--pantry-green)]' : 'bg-[var(--pantry-border)]'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${searchable ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--pantry-ink)]">Make my profile searchable</p>
              <p className="text-xs text-[var(--pantry-warm-grey)]">Other users can find and connect with you</p>
            </div>
          </label>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[var(--pantry-green)] text-white font-semibold text-sm hover:bg-[var(--pantry-green-light)] transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving…' : "Let's go →"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
