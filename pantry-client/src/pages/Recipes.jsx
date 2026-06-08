import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useMealPlanStore } from '../store/mealPlanStore'
import { useFolderStore } from '../store/folderStore'
import { useAuth } from '../lib/auth'
import { RecipeCard } from '../components/recipe/RecipeCard'
import { FolderSidebar } from '../components/recipe/FolderSidebar'
import { RecipeCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'favourites', label: 'Favourites' },
  { key: 'recurring', label: 'Recurring' },
]

export function Recipes() {
  const { folderId } = useParams()
  const { allRecipes, recipesLoading, loadAllRecipes } = useMealPlanStore()
  const { folders, loadFolders } = useFolderStore()
  const { user } = useAuth()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (user?.id) {
      loadAllRecipes(user.id)
      loadFolders(user.id)
    }
  }, [user?.id])

  const recipeList = Object.values(allRecipes)

  // Active folder object (for heading)
  const activeFolder = folderId ? folders.find((f) => f.id === folderId) : null

  const filtered = recipeList.filter((r) => {
    if (folderId) {
      if (r.folder_id !== folderId) return false
    }
    if (tab === 'favourites' && !r.is_favourite) return false
    if (tab === 'recurring' && !r.is_recurring) return false
    if (query.trim()) return r.title.toLowerCase().includes(query.toLowerCase())
    return true
  })

  const heading = activeFolder ? activeFolder.name : 'Recipe Library'
  const subheading = folderId
    ? `${filtered.length} recipe${filtered.length !== 1 ? 's' : ''} in this folder`
    : `${recipeList.length} recipe${recipeList.length !== 1 ? 's' : ''} saved`

  return (
    <div className="flex h-full overflow-hidden">
      {/* Folder sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-[var(--pantry-border)] pt-8 pb-4 px-3 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--pantry-warm-grey)] px-3 mb-3">
          Folders
        </p>
        <FolderSidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              {activeFolder && (
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: activeFolder.color }} />
              )}
              <h1
                className="text-3xl font-bold text-[var(--pantry-ink)]"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                {heading}
              </h1>
            </div>
            <p className="text-[var(--pantry-warm-grey)] text-sm">{subheading}</p>
          </div>

          {/* Mobile folder strip */}
          <div className="lg:hidden -mx-6 px-6 pb-4 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              <FolderSidebar />
            </div>
          </div>

          {/* Skeleton */}
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
                    folderId && !query
                      ? 'Drag recipes from the library onto this folder to add them.'
                      : tab !== 'all'
                      ? `No ${tab === 'favourites' ? 'favourite' : 'recurring'} recipes${folderId ? ' in this folder' : ''}.`
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
      </div>
    </div>
  )
}
