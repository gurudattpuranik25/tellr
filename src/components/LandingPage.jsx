import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

// Fake demo data for the landing page animation
const DEMO_TEXT = "Spent 850 on groceries at DMart"
const DEMO_RESULT = {
  date: "Today",
  description: "Groceries at DMart",
  vendor: "DMart",
  category: { label: "🛒 Groceries", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25" },
  amount: "₹850.00",
}

const FEATURES = [
  "AI parses amount, category & vendor automatically",
  "Real-time Firestore sync across devices",
  "Beautiful spending charts & insights",
  "Google Sign-In — no passwords",
]

function DemoAnimation() {
  const [phase, setPhase] = useState('idle') // idle → typing → parsing → result
  const [typedText, setTypedText] = useState('')
  const [charIdx, setCharIdx] = useState(0)

  // Cycle the animation
  useEffect(() => {
    let timeout

    if (phase === 'idle') {
      timeout = setTimeout(() => {
        setPhase('typing')
        setCharIdx(0)
        setTypedText('')
      }, 1500)
    } else if (phase === 'typing') {
      if (charIdx < DEMO_TEXT.length) {
        timeout = setTimeout(() => {
          setTypedText(DEMO_TEXT.slice(0, charIdx + 1))
          setCharIdx(c => c + 1)
        }, 55)
      } else {
        timeout = setTimeout(() => setPhase('parsing'), 600)
      }
    } else if (phase === 'parsing') {
      timeout = setTimeout(() => setPhase('result'), 1400)
    } else if (phase === 'result') {
      timeout = setTimeout(() => {
        setPhase('idle')
        setTypedText('')
        setCharIdx(0)
      }, 3500)
    }

    return () => clearTimeout(timeout)
  }, [phase, charIdx])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4 }}
      className="w-full max-w-xl mx-auto"
    >
      {/* Phone/terminal mock */}
      <div className="glass-card p-1.5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-blue-500/5">
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100 dark:border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500 font-body">Tellr — dashboard</span>
        </div>

        <div className="p-4 space-y-4">
          {/* Input field */}
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
            phase === 'typing' || phase === 'parsing'
              ? 'border-blue-500/60 bg-slate-50 dark:bg-slate-900/80'
              : 'border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40'
          }`}
          style={phase === 'typing' || phase === 'parsing' ? {
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)'
          } : {}}
          >
            <Sparkles className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${
              phase === 'typing' ? 'text-blue-400' : 'text-slate-400 dark:text-slate-600'
            }`} />
            <span className="text-sm font-body flex-1 min-h-[20px]">
              {typedText ? (
                <span className="text-slate-900 dark:text-white">{typedText}
                  {phase === 'typing' && (
                    <span className="cursor-blink text-blue-400">|</span>
                  )}
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-600">Type an expense...</span>
              )}
            </span>
          </div>

          {/* Parsing shimmer */}
          <AnimatePresence>
            {phase === 'parsing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden"
              >
                <div
                  className="px-4 py-3 text-sm text-blue-400 font-body flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.08) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.2s infinite',
                  }}
                >
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ✨ Claude is parsing...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result row */}
          <AnimatePresence>
            {phase === 'result' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
                  {/* Flash highlight */}
                  <motion.div
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 bg-emerald-500/10 rounded-xl pointer-events-none"
                  />
                  <div className="px-4 py-3 grid grid-cols-4 gap-2 text-xs font-body">
                    <div>
                      <p className="text-slate-400 dark:text-slate-600 mb-0.5">Date</p>
                      <p className="text-slate-600 dark:text-slate-300">{DEMO_RESULT.date}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400 dark:text-slate-600 mb-0.5">Description</p>
                      <p className="text-slate-900 dark:text-white truncate">{DEMO_RESULT.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 dark:text-slate-600 mb-0.5">Amount</p>
                      <p className="text-slate-900 dark:text-white font-semibold font-heading">{DEMO_RESULT.amount}</p>
                    </div>
                  </div>
                  <div className="px-4 pb-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${DEMO_RESULT.category.bg} ${DEMO_RESULT.category.text} ${DEMO_RESULT.category.border}`}>
                      {DEMO_RESULT.category.label}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-body">{DEMO_RESULT.vendor}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Powered by badge */}
          <div className="flex justify-center pt-1">
            <span className="text-xs text-slate-400 dark:text-slate-600 font-body flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Powered by Claude AI
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function LandingPage() {
  const { signInWithGoogle } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      toast.error('Sign-in failed. Please try again.')
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/6 rounded-full blur-3xl translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-blue-400/4 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-heading font-bold text-slate-900 dark:text-white">Tellr</span>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={handleSignIn}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 font-body"
        >
          Sign in
        </motion.button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto w-full text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-body mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Claude AI
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-slate-900 dark:text-white leading-[1.05] tracking-tight mb-6"
          >
            Track money like you
            <br />
            <span className="gradient-text">text a friend.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-body max-w-xl mx-auto mb-10 text-balance"
          >
            No forms. No dropdowns. Just type how you spent money in plain English
            and let AI handle the rest.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.button
              onClick={handleSignIn}
              disabled={isSigningIn}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-semibold font-heading px-8 py-4 rounded-2xl text-base transition-all duration-200 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              {isSigningIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Get Started — It's Free
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </>
              )}
            </motion.button>

            <p className="text-slate-400 dark:text-slate-500 text-sm font-body">
              No credit card required
            </p>
          </motion.div>

          {/* Demo animation */}
          <DemoAnimation />

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto"
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.07 }}
                className="flex items-center gap-2.5 text-left"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-slate-500 dark:text-slate-400 font-body">{feature}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
            <span className="text-slate-400 dark:text-slate-600 text-sm font-body">Tellr</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700 text-sm">·</span>
          <span className="text-slate-400 dark:text-slate-600 text-sm font-body flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Powered by Claude AI
          </span>
        </div>
      </footer>
    </div>
  )
}
