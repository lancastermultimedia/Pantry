import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { CalendarDays, BookOpen, ShoppingCart, Leaf, LogOut, Settings, Users, Calendar } from 'lucide-react'

import { AuthProvider, useAuth } from './lib/auth'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useMealPlanStore } from './store/mealPlanStore'
import { useSocialStore } from './store/socialStore'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { OnboardingTour } from './components/ui/OnboardingTour'
import { NotificationBell } from './components/social/NotificationBell'
import { ProfileSetup } from './components/auth/ProfileSetup'

import { Planner } from './pages/Planner'
import { Recipe } from './pages/Recipe'
import { Recipes } from './pages/Recipes'
import { Shopping } from './pages/Shopping'
import { Login } from './pages/Login'
import People from './pages/People'
import Settings_ from './pages/Settings'
import Shared from './pages/Shared'
import SharedCalendar from './pages/SharedCalendar'

function UserMenu() {
  const { user, signOut, isConfigured } = useAuth()
  const { profile } = useSocialStore()
  const [open, setOpen] = useState(false)

  if (!isConfigured || !user) return null

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'U'
  const avatarUrl = profile?.avatar_url ?? null
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="relative ml-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 rounded-full overflow-hidden bg-[var(--pantry-green)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 hover:ring-2 hover:ring-[var(--pantry-green-light)] transition-all"
      >
        {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 w-44 bg-white rounded-xl shadow-lg border border-[var(--pantry-border)] py-1 z-50">
            <div className="px-4 py-2 border-b border-[var(--pantry-border)]">
              <p className="text-xs font-semibold text-[var(--pantry-ink)] truncate">{displayName}</p>
              <p className="text-[10px] text-[var(--pantry-warm-grey)] truncate">{user.email}</p>
            </div>
            <NavLink
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--pantry-ink)] hover:bg-[var(--pantry-cream)]"
            >
              <Settings size={13} /> Settings
            </NavLink>
            <NavLink
              to="/people"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--pantry-ink)] hover:bg-[var(--pantry-cream)]"
            >
              <Users size={13} /> People
            </NavLink>
            <button
              onClick={() => { setOpen(false); signOut() }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-cream)]"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function WeekInitializer() {
  const { user } = useAuth()
  const { weekStart, initWeek } = useMealPlanStore()

  useEffect(() => {
    if (user) {
      initWeek(user.id, weekStart)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, weekStart])

  return null
}

function ProfileSetupGate({ children }) {
  const { user, isConfigured } = useAuth()
  const { profile, loadProfile, profileLoading } = useSocialStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    async function check() {
      if (user?.id && isConfigured) {
        try { await loadProfile(user.id) } catch {}
      }
      setChecked(true)
    }
    check()
  }, [user?.id])

  if (!checked) return null

  if (isConfigured && user && (!profile || !profile.display_name)) {
    return <ProfileSetup userId={user.id} onComplete={() => loadProfile(user.id)} />
  }

  return children
}

function AppShell({ children }) {
  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--pantry-cream)' }}>
      <WeekInitializer />
      <OnboardingTour />

      {/* Top nav */}
      <nav className="flex items-center px-6 h-14 border-b border-[var(--pantry-border)] bg-white flex-shrink-0">
        <div className="flex items-center gap-2 mr-6">
          <div className="w-7 h-7 rounded-lg bg-[var(--pantry-green)] flex items-center justify-center">
            <Leaf size={14} className="text-white" />
          </div>
          <span
            className="text-lg font-bold text-[var(--pantry-ink)]"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            Pantry
          </span>
        </div>

        <div className="flex items-center gap-1">
          {[
            { to: '/planner', icon: CalendarDays, label: 'Planner' },
            { to: '/recipes', icon: BookOpen, label: 'Recipes' },
            { to: '/shopping', icon: ShoppingCart, label: 'Shopping' },
            { to: '/shared', icon: Calendar, label: 'Shared' },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--pantry-green)]/10 text-[var(--pantry-green)]'
                    : 'text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-ink)] hover:bg-[var(--pantry-border)]'
                }`
              }
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-1.5">
          <NotificationBell />
          <UserMenu />
        </div>
      </nav>

      <main className="flex-1 overflow-hidden">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden flex items-center justify-around h-14 border-t border-[var(--pantry-border)] bg-white flex-shrink-0">
        {[
          { to: '/planner', icon: CalendarDays, label: 'Plan' },
          { to: '/recipes', icon: BookOpen, label: 'Recipes' },
          { to: '/shopping', icon: ShoppingCart, label: 'Shop' },
          { to: '/shared', icon: Calendar, label: 'Shared' },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition-colors ${
                isActive ? 'text-[var(--pantry-green)]' : 'text-[var(--pantry-warm-grey)]'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function ProtectedShell({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>
        <ProfileSetupGate>{children}</ProfileSetupGate>
      </AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/planner" replace />} />
          <Route path="/login" element={<Login />} />

          <Route path="/planner" element={<ProtectedShell><Planner /></ProtectedShell>} />
          <Route path="/planner/:weekStart" element={<ProtectedShell><Planner /></ProtectedShell>} />
          <Route
            path="/recipe/:id"
            element={
              <ProtectedShell>
                <div className="overflow-auto h-full"><Recipe /></div>
              </ProtectedShell>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedShell>
                <div className="overflow-hidden h-full"><Recipes /></div>
              </ProtectedShell>
            }
          />
          <Route
            path="/recipes/folder/:folderId"
            element={
              <ProtectedShell>
                <div className="overflow-hidden h-full"><Recipes /></div>
              </ProtectedShell>
            }
          />
          <Route
            path="/shopping"
            element={
              <ProtectedShell>
                <div className="overflow-auto h-full"><Shopping /></div>
              </ProtectedShell>
            }
          />
          <Route
            path="/shared"
            element={
              <ProtectedShell>
                <div className="overflow-auto h-full"><Shared /></div>
              </ProtectedShell>
            }
          />
          <Route
            path="/shared/:mealPlanId"
            element={
              <ProtectedShell>
                <div className="overflow-auto h-full"><SharedCalendar /></div>
              </ProtectedShell>
            }
          />
          <Route
            path="/people"
            element={
              <ProtectedShell>
                <div className="overflow-auto h-full"><People /></div>
              </ProtectedShell>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedShell>
                <div className="overflow-auto h-full"><Settings_ /></div>
              </ProtectedShell>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
