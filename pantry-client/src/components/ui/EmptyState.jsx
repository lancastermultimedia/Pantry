function PlannerIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="104" height="72" rx="8" fill="#E8E2D9" />
      <rect x="8" y="16" width="104" height="16" rx="8" fill="#2D5016" />
      <rect x="8" y="24" width="104" height="8" fill="#2D5016" />
      {[0,1,2,3].map(i => (
        <rect key={i} x={16 + i*26} y="40" width="20" height="12" rx="3" fill="#FAF7F2" opacity="0.7"/>
      ))}
      {[0,1,2,3].map(i => (
        <rect key={i} x={16 + i*26} y="58" width="20" height="12" rx="3" fill="#FAF7F2" opacity="0.4"/>
      ))}
      {[0,1,2,3].map(i => (
        <rect key={i} x={16 + i*26} y="76" width="20" height="8" rx="3" fill="#FAF7F2" opacity="0.25"/>
      ))}
      <circle cx="94" cy="24" r="5" fill="#C4622D" />
      <path d="M92 24L93.5 25.5L96.5 22.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function RecipeBookIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="15" width="55" height="72" rx="6" fill="#4A7C28" />
      <rect x="25" y="15" width="50" height="72" rx="6" fill="#FAF7F2" />
      <rect x="24" y="15" width="6" height="72" rx="3" fill="#2D5016" />
      <rect x="35" y="28" width="30" height="4" rx="2" fill="#E8E2D9" />
      <rect x="35" y="36" width="24" height="3" rx="1.5" fill="#E8E2D9" />
      <rect x="35" y="43" width="28" height="3" rx="1.5" fill="#E8E2D9" />
      <rect x="35" y="55" width="32" height="18" rx="3" fill="#E8E2D9" />
      <circle cx="51" cy="64" r="5" fill="#C4622D" opacity="0.4"/>
      <path d="M51 60v8M47 64h8" stroke="#C4622D" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function ShoppingBagIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 42h44l-6 42H44L38 42Z" fill="#E8E2D9" />
      <path d="M38 42h44l-6 42H44L38 42Z" fill="url(#bagGrad)" />
      <path d="M46 42c0-7.7 6.3-14 14-14s14 6.3 14 14" stroke="#2D5016" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <rect x="50" y="58" width="20" height="3" rx="1.5" fill="#8C8478" />
      <rect x="50" y="66" width="15" height="3" rx="1.5" fill="#8C8478" />
      <rect x="50" y="74" width="18" height="3" rx="1.5" fill="#8C8478" />
      <circle cx="46" cy="60" r="3" fill="#2D5016" opacity="0.3"/>
      <circle cx="46" cy="68" r="3" fill="#2D5016" opacity="0.3"/>
      <circle cx="46" cy="76" r="3" fill="#2D5016" opacity="0.3"/>
      <defs>
        <linearGradient id="bagGrad" x1="60" y1="42" x2="60" y2="84" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAF7F2"/>
          <stop offset="1" stopColor="#E8E2D9"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function SearchIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="52" cy="45" r="24" fill="#E8E2D9"/>
      <circle cx="52" cy="45" r="18" fill="#FAF7F2"/>
      <path d="M70 63l14 14" stroke="#8C8478" strokeWidth="4" strokeLinecap="round"/>
      <rect x="43" y="43" width="18" height="3" rx="1.5" fill="#C4622D" opacity="0.5"/>
      <rect x="43" y="50" width="12" height="3" rx="1.5" fill="#E8E2D9"/>
    </svg>
  )
}

const illustrations = {
  planner: PlannerIllustration,
  recipes: RecipeBookIllustration,
  shopping: ShoppingBagIllustration,
  search: SearchIllustration,
}

export function EmptyState({ type = 'recipes', title, body, action }) {
  const Illustration = illustrations[type] ?? illustrations.recipes

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="mb-5 opacity-80">
        <Illustration />
      </div>
      <h3
        className="text-xl font-semibold text-[var(--pantry-ink)] mb-2"
        style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
      >
        {title}
      </h3>
      {body && (
        <p className="text-sm text-[var(--pantry-warm-grey)] max-w-xs leading-relaxed mb-5">
          {body}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 rounded-xl bg-[var(--pantry-green)] text-white text-sm font-semibold hover:bg-[var(--pantry-green-light)] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
