export function CostSummary({ total, dayCount = 7 }) {
  return (
    <div className="rounded-xl border border-[var(--pantry-border)] bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--pantry-warm-grey)]">Weekly estimate</span>
        <span className="text-2xl font-bold text-[var(--pantry-ink)]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
          ${total.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--pantry-warm-grey)]">Daily average</span>
        <span className="text-sm font-medium text-[var(--pantry-warm-grey)]">
          ${(total / dayCount).toFixed(2)} / day
        </span>
      </div>
      <p className="text-[10px] text-[var(--pantry-warm-grey)] pt-1 border-t border-[var(--pantry-border)]">
        Estimates based on average US grocery prices
      </p>
    </div>
  )
}
