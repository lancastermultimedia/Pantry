import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useMealPlanStore } from '../store/mealPlanStore'
import { useAuth } from '../lib/auth'
import { RecipeCard } from '../components/recipe/RecipeCard'
import { RecipeCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'favourites', label: 'Favourites' },
  { key: 'recurring', label: 'Recurring' },
]

export function Recipes() {
  const { allRecipes, recipesLoading, loadAllRecipes } = useMealPlanStore()
  const { user } = useAuth()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (user?.id) loadAllRecipes(user.id)
  }, [user?.id])

  const recipeList = Object.values(allRecipes)

  const filtered = recipeList.filter((r) => {
    if (tab === 'favourites' && !r.is_favourite) return false
    if (tab === 'recurring' && !r.is_recurring) return false
    if (query.trim()) return r.title.toLowerCase().includes(query.toLowerCase())
    return true
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold text-[var(--pantry-ink)]"
          style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          Recipe Library
        </h1>
        <p className="text-[var(--pantry-warm-grey)] mt-1 text-sm">
          {recipeList.length} {recipeList.length === 1 ? 'recipe' : 'recipes'} saved
        </p>
      </div>

      {/* Skeleton while loading */}
      {recipesLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <RecipeCardSkeleton key={i} />)}
        </div>
      ) : recipeList.length === 0 ? (
        <EmptyState
          type="recipes"
          title="Your recipe library is empty"
          body="Add recipes to your weekly plan by pasting a URL into any meal slot. They'll all appear here."
        />
      ) : (
        <>
          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pantry-warm-grey)]" />
              <input
                type="text"
                placeholder="Search recipes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[var(--pantry-border)] rounded-xl text-[var(--pantry-ink)] placeholder-[var(--pantry-warm-grey)] focus:outline-none focus:border-[var(--pantry-green-light)]"
              />
            </div>

            <div className="flex items-center rounded-xl border border-[var(--pantry-border)] overflow-hidden text-sm font-medium">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-2 transition-colors ${
                    tab === key
                      ? 'bg-[var(--pantry-green)] text-white'
                      : 'text-[var(--pantry-warm-grey)] hover:bg-[var(--pantry-border)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              type="search"
              title="No results"
              body={
                tab !== 'all'
                  ? `You don't have any ${tab === 'favourites' ? 'favourite' : 'recurring'} recipes yet.`
                  : `No recipes match "${query}".`
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
