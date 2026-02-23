import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, RefreshCw, Loader2, Sparkles } from 'lucide-react'
import { generateSavingsSuggestions } from '../services/claudeService'

export default function SavingsSuggestions({ expenses }) {
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const tips = await generateSavingsSuggestions(expenses)
      setSuggestions(tips)
    } catch {
      setError('Could not generate suggestions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasLoaded = suggestions !== null || error !== null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="glass-card p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold font-heading text-slate-200">Smart Savings Tips</h3>
        </div>

        {hasLoaded ? (
          <button
            onClick={load}
            disabled={loading || expenses.length < 3}
            title="Refresh suggestions"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        ) : (
          <button
            onClick={load}
            disabled={loading || expenses.length < 3}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold font-heading hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Sparkles className="w-3 h-3" />
            Generate tips
          </button>
        )}
      </div>

      {/* Body */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 py-5 justify-center"
          >
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-sm text-slate-500 font-body">Analysing your spending habits...</span>
          </motion.div>
        ) : error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-rose-400 font-body py-2"
          >
            {error}
          </motion.p>
        ) : suggestions ? (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {suggestions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold font-heading flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 font-body leading-relaxed">{s.tip}</p>
                  {s.potential && (
                    <span className="mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-body">
                      Save {s.potential}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.p
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-slate-600 font-body"
          >
            {expenses.length < 3
              ? 'Add at least 3 expenses to get personalised savings tips.'
              : 'Click "Generate tips" to get AI-powered savings suggestions based on your spending.'}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
