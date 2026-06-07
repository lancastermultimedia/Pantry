import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

export function ProtectedRoute({ children }) {
  const { user, loading, isConfigured } = useAuth()

  // No Supabase env vars → bypass auth, render directly
  if (!isConfigured) return children

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--pantry-cream)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--pantry-green)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--pantry-warm-grey)]">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return children
}
