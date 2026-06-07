import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const { fallback } = this.props
    if (fallback) return fallback

    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--pantry-accent)]/10 flex items-center justify-center">
          <AlertTriangle size={20} className="text-[var(--pantry-accent)]" />
        </div>
        <div>
          <p className="font-semibold text-[var(--pantry-ink)]">Something went wrong</p>
          <p className="text-sm text-[var(--pantry-warm-grey)] mt-1">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
        </div>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          className="text-sm font-medium text-[var(--pantry-green)] hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }
}
