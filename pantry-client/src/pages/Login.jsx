import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../lib/auth'

export function Login() {
  const { user, loading, signInWithEmail, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in → go straight to planner
  if (!loading && user) return <Navigate to="/planner" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: authError } = await signInWithEmail(email)
    setSubmitting(false)
    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--pantry-cream)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-[var(--pantry-green)] flex items-center justify-center mb-5 shadow-lg">
            <Leaf size={26} className="text-white" />
          </div>
          <h1
            className="text-3xl font-bold text-[var(--pantry-ink)] text-center"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            Welcome to Pantry
          </h1>
          <p className="text-[var(--pantry-warm-grey)] text-sm mt-2 text-center">
            Your weekly meal planning companion
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--pantry-border)] p-6 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[var(--pantry-green)]/10 flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 11L9 16L18 6" stroke="#2D5016" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-semibold text-[var(--pantry-ink)]">Check your inbox</p>
              <p className="text-sm text-[var(--pantry-warm-grey)] mt-1">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-xs text-[var(--pantry-green)] mt-4 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--pantry-warm-grey)] uppercase tracking-wide mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-[var(--pantry-border)] rounded-xl px-4 py-3 text-sm text-[var(--pantry-ink)] bg-[var(--pantry-cream)] focus:outline-none focus:border-[var(--pantry-green)] transition-colors placeholder:text-[var(--pantry-border)]"
                />
              </div>

              {error && (
                <p className="text-xs text-[var(--pantry-accent)] bg-[var(--pantry-accent)]/8 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {!isConfigured && (
                <p className="text-xs text-[var(--pantry-warm-grey)] bg-[var(--pantry-border)]/60 rounded-lg px-3 py-2">
                  Supabase not configured — set <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> in <code className="font-mono">.env</code> to enable auth.
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center py-3"
                disabled={submitting || !email.trim()}
              >
                {submitting ? 'Sending…' : 'Send magic link'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[var(--pantry-warm-grey)] mt-6">
          No password needed — sign in with a one-tap email link.
        </p>
      </div>
    </div>
  )
}
