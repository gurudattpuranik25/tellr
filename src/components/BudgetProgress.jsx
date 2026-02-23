import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Target, Settings } from 'lucide-react'

const CATEGORY_EMOJIS = {
  'Food & Dining': '🍽️', 'Groceries': '🛒', 'Housing/Rent': '🏠',
  'Transport': '🚗', 'Shopping': '🛍️', 'Entertainment': '🎭',
  'Health': '💊', 'Utilities': '⚡', 'Subscriptions': '📱',
  'Education': '📚', 'Travel': '✈️', 'Personal Care': '💅',
  'Gifts': '🎁', 'Other': '📦',
}

function getBarColor(pct) {
  if (pct >= 100) return 'bg-rose-500'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-blue-500'
}

function getStatus(pct) {
  if (pct >= 100) return { text: 'Over budget!', cls: 'text-rose-400' }
  if (pct >= 80) return { text: 'Almost at limit', cls: 'text-amber-400' }
  return null
}

export default function BudgetProgress({
  expenses,
  budgets,
  selectedMonth,
  selectedYear,
  onManage,
}) {
  const items = useMemo(() => {
    const now = new Date()
    const month = selectedMonth ?? now.getMonth()
    const year = selectedYear ?? now.getFullYear()

    const monthExpenses = expenses.filter(e => {
      const d = e.date instanceof Date ? e.date : new Date(e.date)
      return d.getMonth() === month && d.getFullYear() === year
    })

    const catTotals = monthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})

    return Object.entries(budgets)
      .map(([category, limit]) => {
        const spent = catTotals[category] || 0
        const pct = limit > 0 ? (spent / limit) * 100 : 0
        return { category, limit, spent, pct }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [expenses, budgets, selectedMonth, selectedYear])

  const hasBudgets = items.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold font-heading text-slate-200">Budget Tracker</h3>
        </div>
        <button
          onClick={onManage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium font-heading text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 hover:border-slate-600 transition-all duration-200"
        >
          <Settings className="w-3.5 h-3.5" />
          Manage
        </button>
      </div>

      {!hasBudgets ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <p className="text-slate-500 text-sm font-body text-center">
            No budgets set. Add monthly limits to track your spending.
          </p>
          <button
            onClick={onManage}
            className="px-4 py-2 rounded-xl text-sm font-semibold font-heading text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            Set Budgets
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {items.map(({ category, limit, spent, pct }) => {
            const status = getStatus(pct)
            const barColor = getBarColor(pct)
            const remaining = Math.max(limit - spent, 0)
            const displayPct = Math.min(pct, 100)

            return (
              <div key={category} className="space-y-1.5">
                {/* Category name + % */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm">{CATEGORY_EMOJIS[category] || '📦'}</span>
                    <span className="text-xs font-medium font-body text-slate-300 truncate">
                      {category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {status && (
                      <span className={`text-xs font-medium font-body ${status.cls}`}>
                        {status.text}
                      </span>
                    )}
                    <span className="text-xs font-semibold font-heading text-white tabular-nums">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${displayPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${barColor}`}
                  />
                </div>

                {/* Spent / remaining */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-body tabular-nums">
                    ₹{spent.toLocaleString('en-IN')} of ₹{limit.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-body tabular-nums">
                    {pct >= 100 ? (
                      <span className="text-rose-500">
                        ₹{(spent - limit).toLocaleString('en-IN')} over
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        ₹{remaining.toLocaleString('en-IN')} left
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
