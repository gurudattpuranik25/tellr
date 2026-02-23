import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Check } from 'lucide-react'
import { setBudget, removeBudget } from '../services/budgetService'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'Food & Dining',  emoji: '🍽️' },
  { value: 'Groceries',      emoji: '🛒' },
  { value: 'Housing/Rent',   emoji: '🏠' },
  { value: 'Transport',      emoji: '🚗' },
  { value: 'Shopping',       emoji: '🛍️' },
  { value: 'Entertainment',  emoji: '🎭' },
  { value: 'Health',         emoji: '💊' },
  { value: 'Utilities',      emoji: '⚡' },
  { value: 'Subscriptions',  emoji: '📱' },
  { value: 'Education',      emoji: '📚' },
  { value: 'Travel',         emoji: '✈️' },
  { value: 'Personal Care',  emoji: '💅' },
  { value: 'Gifts',          emoji: '🎁' },
  { value: 'Other',          emoji: '📦' },
]

export default function BudgetManager({ isOpen, onClose, budgets, userId }) {
  const [values, setValues] = useState({})
  const [saving, setSaving] = useState({})

  useEffect(() => {
    if (isOpen) {
      const init = {}
      CATEGORIES.forEach(cat => {
        init[cat.value] = budgets[cat.value] ? String(budgets[cat.value]) : ''
      })
      setValues(init)
    }
  }, [isOpen, budgets])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleSave = async (category) => {
    const amt = parseFloat(values[category])
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    setSaving(s => ({ ...s, [category]: true }))
    try {
      await setBudget(userId, category, Math.round(amt * 100) / 100)
      toast.success(`Budget set for ${category}`)
    } catch {
      toast.error('Failed to save budget')
    } finally {
      setSaving(s => ({ ...s, [category]: false }))
    }
  }

  const handleRemove = async (category) => {
    setSaving(s => ({ ...s, [category]: true }))
    try {
      await removeBudget(userId, category)
      setValues(v => ({ ...v, [category]: '' }))
      toast.success(`Budget removed`)
    } catch {
      toast.error('Failed to remove budget')
    } finally {
      setSaving(s => ({ ...s, [category]: false }))
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-lg pointer-events-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
                <div>
                  <h2 className="text-base font-semibold font-heading text-white">Manage Budgets</h2>
                  <p className="text-xs text-slate-500 font-body mt-0.5">
                    Set monthly spending limits per category
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Category list */}
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
                {CATEGORIES.map(cat => {
                  const hasBudget = Boolean(budgets[cat.value])
                  const currentVal = budgets[cat.value] ? String(budgets[cat.value]) : ''
                  const isDirty = (values[cat.value] || '') !== currentVal

                  return (
                    <div
                      key={cat.value}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/40 transition-colors"
                    >
                      <span className="text-base w-6 text-center flex-shrink-0">{cat.emoji}</span>
                      <span className="text-sm font-medium text-slate-300 font-body flex-1 min-w-0 truncate">
                        {cat.value}
                      </span>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-heading">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={values[cat.value] || ''}
                            onChange={e => setValues(v => ({ ...v, [cat.value]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSave(cat.value)
                            }}
                            placeholder="No limit"
                            className="w-28 bg-slate-900/60 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-heading tabular-nums"
                          />
                        </div>

                        {isDirty && (values[cat.value] || '') !== '' && (
                          <button
                            onClick={() => handleSave(cat.value)}
                            disabled={saving[cat.value]}
                            className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-all disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {hasBudget && (
                          <button
                            onClick={() => handleRemove(cat.value)}
                            disabled={saving[cat.value]}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/5 flex-shrink-0">
                <p className="text-xs text-slate-600 font-body">
                  Type an amount and press Enter or ✓ to save. Budgets reset monthly.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
