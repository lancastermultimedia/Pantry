import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, CalendarDays, ShoppingCart, Heart } from 'lucide-react'

const TOUR_KEY = 'pantry-onboarding-v1'

const STEPS = [
  {
    icon: CalendarDays,
    iconColor: 'bg-[var(--pantry-green)]',
    title: 'Plan your week',
    body: 'Click any + slot in the planner to add a recipe. Paste a URL and Pantry fetches the title, ingredients, and instructions automatically.',
    step: 1,
  },
  {
    icon: ShoppingCart,
    iconColor: 'bg-[var(--pantry-accent)]',
    title: 'Auto-generated shopping list',
    body: 'Every recipe you add updates your shopping list instantly. Toggle between By Recipe and Combined views, then copy the list to your phone.',
    step: 2,
  },
  {
    icon: Heart,
    iconColor: 'bg-pink-500',
    title: 'Save favourites & recurring meals',
    body: 'Heart any recipe to save it to your library. Mark meals as recurring and they\'ll appear automatically in the right slot every week.',
    step: 3,
  },
]

export function OnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(TOUR_KEY, '1')
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else dismiss()
  }

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="relative w-full max-w-sm bg-[var(--pantry-cream)] rounded-3xl shadow-2xl border border-[var(--pantry-border)] p-8 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-ink)] hover:bg-[var(--pantry-border)] transition-colors"
              >
                <X size={16} />
              </button>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl ${current.iconColor} flex items-center justify-center mb-5`}>
                <Icon size={24} className="text-white" />
              </div>

              {/* Step indicator */}
              <div className="flex gap-1.5 mb-4">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-[var(--pantry-green)]' : 'w-2 bg-[var(--pantry-border)]'}`}
                  />
                ))}
              </div>

              <h2
                className="text-xl font-bold text-[var(--pantry-ink)] mb-2"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                {current.title}
              </h2>
              <p className="text-sm text-[var(--pantry-warm-grey)] leading-relaxed mb-7">
                {current.body}
              </p>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep((s) => s - 1)}
                  disabled={step === 0}
                  className="flex items-center gap-1 text-sm text-[var(--pantry-warm-grey)] hover:text-[var(--pantry-ink)] disabled:opacity-0 transition-colors"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--pantry-green)] text-white text-sm font-semibold hover:bg-[var(--pantry-green-light)] transition-colors"
                >
                  {step < STEPS.length - 1 ? (
                    <>Next <ChevronRight size={15} /></>
                  ) : (
                    "Let's go!"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
