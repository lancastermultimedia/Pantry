export function Skeleton({ className = '', style }) {
  return (
    <div
      className={`animate-pulse bg-[var(--pantry-border)] rounded-lg ${className}`}
      style={style}
    />
  )
}

export function MealSlotSkeleton() {
  return (
    <div className="p-3 space-y-2">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function RecipeCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--pantry-border)] bg-white overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-3 w-3/5 rounded-md" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-12 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ShoppingListSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="h-4 w-36 rounded-md" />
          </div>
          <div className="rounded-xl border border-[var(--pantry-border)] overflow-hidden divide-y divide-[var(--pantry-border)]">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-5 h-5 rounded-md flex-shrink-0" />
                <Skeleton className="h-3 flex-1 rounded-md" style={{ maxWidth: `${50 + j * 15}%` }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
