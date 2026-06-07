import { useParams } from 'react-router-dom'
import { useMealPlanStore } from '../store/mealPlanStore'
import { RecipeView } from '../components/recipe/RecipeView'

export function Recipe() {
  const { id } = useParams()
  const { recipes, allRecipes } = useMealPlanStore()
  const recipe = allRecipes[id] ?? recipes[id]

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--pantry-warm-grey)]">
        <p className="text-lg font-medium">Recipe not found.</p>
      </div>
    )
  }

  return <RecipeView recipe={recipe} />
}
