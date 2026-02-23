import { motion } from 'framer-motion'
import { Repeat } from 'lucide-react'

const CATEGORY_EMOJIS = {
  'Food & Dining': '🍽️', 'Groceries': '🛒', 'Housing/Rent': '🏠',
  'Transport': '🚗', 'Shopping': '🛍️', 'Entertainment': '🎭',
  'Health': '💊', 'Utilities': '⚡', 'Subscriptions': '📱',
  'Education': '📚', 'Travel': '✈️', 'Personal Care': '💅',
  'Gifts': '🎁', 'Other': '📦',
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function RecurringExpenses({ recurringGroups }) {
  if (!recurringGroups || recurringGroups.length === 0) return null

  const totalMonthly = recurringGroups.reduce((s, g) => s + g.avgAmount, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold font-heading text-slate-200">Recurring Expenses</h3>
        </div>
        <div className="glass-card px-3 py-1.5 flex items-center gap-2">
          <span className="text-xs text-slate-400 font-body">Est. monthly</span>
          <span className="text-sm font-semibold font-heading text-white">
            ₹{totalMonthly.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {recurringGroups.map((group, i) => (
          <motion.div
            key={`${group.category}-${group.name}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/40 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">
                {CATEGORY_EMOJIS[group.category] || '📦'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 font-body truncate">
                  {capitalize(group.name)}
                </p>
                <p className="text-xs text-slate-500 font-body">
                  {group.monthCount} month{group.monthCount > 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-semibold font-heading text-white tabular-nums">
                ₹{group.avgAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-600 font-body">/month</p>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-600 font-body">
        Detected from expenses appearing in 2+ months with consistent amounts.
      </p>
    </motion.div>
  )
}
