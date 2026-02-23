import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, RefreshCw, Loader2, Sparkles, X } from 'lucide-react'
import { generateSavingsSuggestions } from '../services/claudeService'

export default function SavingsSuggestions({ isOpen, onClose, expenses }) {
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

  // Auto-load when modal opens (if enough data and not yet loaded)
  useEffect(() => {
    if (isOpen && suggestions === null && !loading && expenses.length >= 3) {
      load()
    }
  }, [isOpen])

  const hasLoaded = suggestions !== null || error !== null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md pointer-events-auto glass-card flex flex-col"
              style={{ maxHeight: 'calc(100vh - 80px)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold font-heading text-slate-200">Smart Savings Tips</p>
                    <p className="text-xs text-slate-500 font-body">Powered by Claude</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {hasLoaded && (
                    <button
                      onClick={load}
                      disabled={loading || expenses.length < 3}
                      title="Refresh suggestions"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 py-12 justify-center"
                    >
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      <span className="text-sm text-slate-500 font-body">Analysing your spending habits...</span>
                    </motion.div>
                  ) : error ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3 py-8"
                    >
                      <p className="text-sm text-rose-400 font-body text-center">{error}</p>
                      <button
                        onClick={load}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold font-heading hover:bg-amber-500/20 transition-all duration-200"
                      >
                        <RefreshCw className="w-3 h-3" /> Try again
                      </button>
                    </motion.div>
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
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4 py-12"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-amber-400" />
                      </div>
                      <p className="text-sm text-slate-500 font-body text-center max-w-xs">
                        {expenses.length < 3
                          ? 'Add at least 3 expenses to get personalised savings tips.'
                          : 'Get AI-powered savings suggestions based on your spending habits.'}
                      </p>
                      {expenses.length >= 3 && (
                        <button
                          onClick={load}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold font-heading hover:bg-amber-500/20 transition-all duration-200"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Generate tips
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
