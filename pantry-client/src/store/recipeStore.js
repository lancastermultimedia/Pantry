import { create } from 'zustand'

export const useRecipeStore = create((set, get) => ({
  savedRecipes: {},
  searchQuery: '',
  filter: 'all',

  setFilter: (filter) => set({ filter }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  toggleFavourite: (recipeId) => {
    const { savedRecipes } = get()
    const recipe = savedRecipes[recipeId]
    if (!recipe) return
    set({
      savedRecipes: {
        ...savedRecipes,
        [recipeId]: { ...recipe, is_favourite: !recipe.is_favourite },
      },
    })
  },

  getFilteredRecipes: () => {
    const { savedRecipes, filter, searchQuery } = get()
    let recipes = Object.values(savedRecipes)
    if (filter === 'favourites') recipes = recipes.filter((r) => r.is_favourite)
    if (filter === 'recurring') recipes = recipes.filter((r) => r.is_recurring)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      recipes = recipes.filter((r) => r.title.toLowerCase().includes(q))
    }
    return recipes
  },
}))
