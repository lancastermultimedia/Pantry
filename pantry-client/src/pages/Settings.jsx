import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Leaf } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useSocialStore, initials } from '../store/socialStore'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIMES = ['06:00', '08:00', '10:00', '12:00', '16:00', '18:00', '20:00']

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { profile, loadProfile, upsertProfile, uploadAvatar } = useSocialStore()

  const [displayName, setDisplayName] = useState('')
  const [searchable, setSearchable] = useState(true)
  const [digestEnabled, setDigestEnabled] = useState(true)
  const [digestDay, setDigestDay] = useState('sunday')
  const [digestTime, setDigestTime] = useState('18:00')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.id) loadProfile(user.id)
  }, [user?.id])

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setSearchable(profile.is_searchable ?? true)
      setDigestEnabled(profile.digest_enabled ?? true)
      setDigestDay(profile.digest_send_day ?? 'sunday')
      setDigestTime(profile.digest_send_time ?? '18:00')
    }
  }, [profile])

  function handleAvatarPick(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    const name = displayName.trim()
    if (!name) { setError('Display name is required.'); return }
    setSaving(true)
    setError('')
    try {
      let avatarUrl = null
      if (avatarFile && user?.id) {
        try { avatarUrl = await uploadAvatar(user.id, avatarFile) } catch (e) {
          setError('Photo upload failed — check your Supabase storage bucket. Your other changes were saved.')
        }
      }
      await upsertProfile(user?.id, {
        display_name: name,
        is_searchable: searchable,
        digest_enabled: digestEnabled,
        digest_send_day: digestDay,
        digest_send_time: digestTime,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    await signOut()
    navigate('/login')
  }

  const avatarSrc = avatarPreview ?? profile?.avatar_url
  const avatarLabel = profile?.display_name ?? displayName

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
            Settings
          </h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-8">

        {/* Profile section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--pantry-warm-grey)] mb-4">Profile</h2>
          <div className="bg-white rounded-2xl border border-[var(--pantry-border)] p-6 space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--pantry-border)] flex items-center justify-center flex-shrink-0">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-[var(--pantry-warm-grey)]">{initials(avatarLabel)}</span>
                )}
              </div>
              <div className="space-y-1">
                <label className="cursor-pointer flex items-center gap-2 text-sm font-medium text-[var(--pantry-green)] hover:underline">
                  <Upload size={13} />
                  {avatarFile ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                </label>
                <p className="text-xs text-[var(--pantry-warm-grey)]">JPG, PNG, WebP · max 2MB</p>
              </div>
            </div>

            {/* Display name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setError('') }}
                className="w-full px-4 py-2.5 text-sm bg-[var(--pantry-cream)] border border-[var(--pantry-border)] rounded-xl focus:outline-none focus:border-[var(--pantry-green-light)] text-[var(--pantry-ink)]"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">Email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                readOnly
                className="w-full px-4 py-2.5 text-sm bg-[var(--pantry-border)]/40 border border-[var(--pantry-border)] rounded-xl text-[var(--pantry-warm-grey)] cursor-default"
              />
            </div>
          </div>
        </section>

        {/* Privacy section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--pantry-warm-grey)] mb-4">Privacy</h2>
          <div className="bg-white rounded-2xl border border-[var(--pantry-border)] p-6">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[var(--pantry-ink)]">Searchable profile</p>
                <p className="text-xs text-[var(--pantry-warm-grey)] mt-0.5">Allow other Pantry users to find and connect with you</p>
              </div>
              <div
                onClick={() => setSearchable((v) => !v)}
                className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${searchable ? 'bg-[var(--pantry-green)]' : 'bg-[var(--pantry-border)]'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${searchable ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </label>
          </div>
        </section>

        {/* Weekly digest section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--pantry-warm-grey)] mb-4">Weekly digest</h2>
          <div className="bg-white rounded-2xl border border-[var(--pantry-border)] p-6 space-y-4">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[var(--pantry-ink)]">Send weekly meal plan digest</p>
                <p className="text-xs text-[var(--pantry-warm-grey)] mt-0.5">Get a summary of your upcoming week's meals by email</p>
              </div>
              <div
                onClick={() => setDigestEnabled((v) => !v)}
                className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${digestEnabled ? 'bg-[var(--pantry-green)]' : 'bg-[var(--pantry-border)]'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${digestEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </label>

            {digestEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">Day</label>
                  <select
                    value={digestDay}
                    onChange={(e) => setDigestDay(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--pantry-cream)] border border-[var(--pantry-border)] rounded-xl focus:outline-none focus:border-[var(--pantry-green-light)] text-[var(--pantry-ink)]"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d.toLowerCase()}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--pantry-warm-grey)]">Time</label>
                  <select
                    value={digestTime}
                    onChange={(e) => setDigestTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--pantry-cream)] border border-[var(--pantry-border)] rounded-xl focus:outline-none focus:border-[var(--pantry-green-light)] text-[var(--pantry-ink)]"
                  >
                    {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Save button */}
        {error && <p className="text-sm text-[var(--pantry-accent)]">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[var(--pantry-green)] text-white font-semibold text-sm hover:bg-[var(--pantry-green-light)] transition-colors disabled:opacity-40"
        >
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
        </button>

        {/* Danger zone */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-500 mb-4">Danger zone</h2>
          <div className="bg-white rounded-2xl border border-red-100 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--pantry-ink)]">Sign out</p>
                <p className="text-xs text-[var(--pantry-warm-grey)] mt-0.5">You'll need to log in again to use Pantry</p>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--pantry-border)] text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-cream)] transition-colors"
              >
                Sign out
              </button>
            </div>
            <hr className="border-[var(--pantry-border)]" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-red-600">Delete account</p>
                <p className="text-xs text-[var(--pantry-warm-grey)] mt-0.5">Permanently delete all your data. Cannot be undone.</p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </section>

        <div className="pb-8" />
      </div>
    </div>
  )
}
