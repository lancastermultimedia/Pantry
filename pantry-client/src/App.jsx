import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { CalendarDays, BookOpen, ShoppingCart, Leaf, LogOut, User } from 'lucide-react'

import { AuthProvider, useAuth } from './lib/auth'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useMealPlanStore } from './store/mealPlanStore'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { OnboardingTour } from './components/ui/OnboardingTour'

import { Planner } from './pages/Planner'
import { Recipe } from './pages/Recipe'
import { Recipes } from './pages/Recipes'
import { Shopping } from './pages/Shopping'
import { Login } from './pages/Login'

function UserMenu() {
  const { user, signOut, isConfigured } = useAuth()

  if (!isConfigured || !user) return null

  const initials = user.email?.slice(0, 2).toUpperCase() ?? 'U'
  const displayEmail = user.email ?? ''

  return (
    <div className="relative ml-auto flex items-center gap-2">
      <div className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-[var(--pantry-border)] transition-colors group">
        <div className="w-7 h-7 rounded-full bg-[var(--pantry-green)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {initials}
        </div>
        <span className="text-xs text-[var(--pantry-warm-grey)] max-w-[120px] truncate hidden sm:block">
          {displayEmail}
        </span>
      </div>
      <button
        onClick={signOut}
        title="Sign out"
        className="p-1.5 rounded-lg text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-accent)] hover:bg-[var(--pantry-border)] transition-colors"
      >
        <LogOut size={15} />
      </button>
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
    // Only run when the user or week changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, weekStart])

  return null
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
              {label}
            </NavLink>
          ))}
        </div>

        <UserMenu />
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
      <AppShell>{children}</AppShell>
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

          <Route
            path="/planner"
            element={<ProtectedShell><Planner /></ProtectedShell>}
          />
          <Route
            path="/planner/:weekStart"
            element={<ProtectedShell><Planner /></ProtectedShell>}
          />
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
