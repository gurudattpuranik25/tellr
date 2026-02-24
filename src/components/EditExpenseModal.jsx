import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2 } from 'lucide-react'

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

function toInputDate(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString().split('T')[0]
}

export default function EditExpenseModal({ expense, onSave, onClose }) {
  const [form, setForm] = useState({
    description: '',
    vendor: '',
    amount: '',
    category: 'Other',
    date: '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const firstInputRef = useRef(null)

  // Populate form when expense changes
  useEffect(() => {
    if (expense) {
      setForm({
        description: expense.description || '',
        vendor: expense.vendor === 'Unknown' ? '' : (expense.vendor || ''),
        amount: expense.amount?.toString() || '',
        category: expense.category || 'Other',
        date: toInputDate(expense.date),
      })
      setErrors({})
    }
  }, [expense])

  // Focus first input & close on Escape
  useEffect(() => {
    if (expense) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [expense, onClose])

  const validate = () => {
    const errs = {}
    if (!form.description.trim()) errs.description = 'Required'
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount'
    if (!form.date) errs.date = 'Required'
    return errs
  }

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      await onSave(expense.id, {
        description: form.description.trim(),
        vendor: form.vendor.trim() || 'Unknown',
        amount: Math.round(parseFloat(form.amount) * 100) / 100,
        category: form.category,
        date: form.date,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {expense && (
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
              className="w-full max-w-md pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/50"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h2 className="text-base font-semibold font-heading text-slate-900 dark:text-white">Edit Expense</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-body mt-0.5">Update the details below</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 font-heading mb-1.5">
                    Description
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={form.description}
                    onChange={e => handleChange('description', e.target.value)}
                    placeholder="e.g. Lunch at Swiggy"
                    className={`w-full bg-white/80 dark:bg-slate-800/80 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-all duration-200 font-body ${
                      errors.description
                        ? 'border-rose-500/60 focus:border-rose-500'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                    }`}
                  />
                  {errors.description && (
                    <p className="text-xs text-rose-400 mt-1 font-body">{errors.description}</p>
                  )}
                </div>

                {/* Amount + Category row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 font-heading mb-1.5">
                      Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-heading">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={e => handleChange('amount', e.target.value)}
                        placeholder="0.00"
                        className={`w-full bg-white/80 dark:bg-slate-800/80 border rounded-xl pl-7 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-all duration-200 font-heading tabular-nums ${
                          errors.amount
                            ? 'border-rose-500/60 focus:border-rose-500'
                            : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                        }`}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-xs text-rose-400 mt-1 font-body">{errors.amount}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 font-heading mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      max={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()}
                      onChange={e => handleChange('date', e.target.value)}
                      className={`w-full bg-white/80 dark:bg-slate-800/80 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none transition-all duration-200 font-body [color-scheme:light] dark:[color-scheme:dark] ${
                        errors.date
                          ? 'border-rose-500/60 focus:border-rose-500'
                          : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                      }`}
                    />
                    {errors.date && (
                      <p className="text-xs text-rose-400 mt-1 font-body">{errors.date}</p>
                    )}
                  </div>
                </div>

                {/* Vendor */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 font-heading mb-1.5">
                    Vendor <span className="text-slate-400 dark:text-slate-600 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={e => handleChange('vendor', e.target.value)}
                    placeholder="e.g. Swiggy, DMart, Zomato"
                    className="w-full bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 font-body"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 font-heading mb-1.5">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => handleChange('category', cat.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all duration-150 border ${
                          form.category === cat.value
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                            : 'bg-slate-100/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span className="truncate font-body">{cat.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium font-heading text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/60 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-heading text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-all duration-200 shadow-lg shadow-blue-500/20"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
