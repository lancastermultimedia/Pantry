import { WeekHeader } from '../components/planner/WeekHeader'
import { WeekGrid } from '../components/planner/WeekGrid'
import { ShoppingListPanel } from '../components/shopping/ShoppingListPanel'

export function Planner() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <WeekHeader />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <WeekGrid />
        </div>
        <div className="hidden lg:flex h-full">
          <ShoppingListPanel />
        </div>
      </div>
    </div>
  )
}
