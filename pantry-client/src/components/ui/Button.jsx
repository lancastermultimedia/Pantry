export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, className = '', type = 'button' }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2'

  const variants = {
    primary: 'bg-[var(--pantry-green)] text-white hover:bg-[var(--pantry-green-light)] focus-visible:ring-[var(--pantry-green)]',
    secondary: 'bg-transparent border border-[var(--pantry-border)] text-[var(--pantry-ink)] hover:bg-[var(--pantry-border)] focus-visible:ring-[var(--pantry-border)]',
    ghost: 'bg-transparent text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-ink)] hover:bg-[var(--pantry-border)] focus-visible:ring-[var(--pantry-border)]',
    danger: 'bg-transparent text-[var(--pantry-accent)] hover:bg-red-50 focus-visible:ring-[var(--pantry-accent)]',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1',
    md: 'text-sm px-4 py-2 gap-1.5',
    lg: 'text-base px-6 py-3 gap-2',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}
