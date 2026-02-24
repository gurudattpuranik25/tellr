import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, X, TrendingUp, TrendingDown } from 'lucide-react'

const CATEGORY_EMOJIS = {
  'Food & Dining': '🍽️', 'Groceries': '🛒', 'Housing/Rent': '🏠',
  'Transport': '🚗', 'Shopping': '🛍️', 'Entertainment': '🎭',
  'Health': '💊', 'Utilities': '⚡', 'Subscriptions': '📱',
  'Education': '📚', 'Travel': '✈️', 'Personal Care': '💅',
  'Gifts': '🎁', 'Other': '📦',
}

function getMonthTotal(expenses, month, year) {
  return expenses
    .filter(e => {
      const d = e.date instanceof Date ? e.date : new Date(e.date)
      return d.getMonth() === month && d.getFullYear() === year
    })
    .reduce((s, e) => s + e.amount, 0)
}

function getCategoryTotal(expenses, category, month, year) {
  return expenses
    .filter(e => {
      const d = e.date instanceof Date ? e.date : new Date(e.date)
      return d.getMonth() === month && d.getFullYear() === year && e.category === category
    })
    .reduce((s, e) => s + e.amount, 0)
}

export default function SpendingNudges({ expenses, selectedMonth, selectedYear }) {
  const [dismissed, setDismissed] = useState(new Set())

  const nudges = useMemo(() => {
    const now = new Date()
    const selMonth = selectedMonth ?? now.getMonth()
    const selYear = selectedYear ?? now.getFullYear()

    // Collect all categories present in the data
    const allCategories = [...new Set(expenses.map(e => e.category).filter(Boolean))]

    const results = []

    for (const category of allCategories) {
      // Gather totals for the 3 months BEFORE the selected month
      const historicTotals = []
      for (let i = 1; i <= 3; i++) {
        let m = selMonth - i
        let y = selYear
        while (m < 0) { m += 12; y-- }
        const total = getCategoryTotal(expenses, category, m, y)
        if (total > 0) historicTotals.push(total)
      }

      // Need at least 2 months of history to produce a meaningful nudge
      if (historicTotals.length < 2) continue

      const avg = historicTotals.reduce((s, v) => s + v, 0) / historicTotals.length
      const current = getCategoryTotal(expenses, category, selMonth, selYear)

      // Only nudge if current spending is meaningful (> ₹50)
      if (current < 50) continue

      const pctDiff = avg > 0 ? ((current - avg) / avg) * 100 : 0

      // Nudge if deviation is >= 15% either way
      if (Math.abs(pctDiff) < 15) continue

      results.push({ category, avg, current, pctDiff })
    }

    // Also check overall monthly spending vs 3-month avg
    const monthlyHistoric = []
    for (let i = 1; i <= 3; i++) {
      let m = selMonth - i
      let y = selYear
      while (m < 0) { m += 12; y-- }
      const total = getMonthTotal(expenses, m, y)
      if (total > 0) monthlyHistoric.push(total)
    }

    if (monthlyHistoric.length >= 2) {
      const monthAvg = monthlyHistoric.reduce((s, v) => s + v, 0) / monthlyHistoric.length
      const currentMonthTotal = getMonthTotal(expenses, selMonth, selYear)
      const monthPct = monthAvg > 0 ? ((currentMonthTotal - monthAvg) / monthAvg) * 100 : 0

      if (Math.abs(monthPct) >= 15 && currentMonthTotal > 100) {
        results.unshift({
          category: '__overall__',
          avg: monthAvg,
          current: currentMonthTotal,
          pctDiff: monthPct,
        })
      }
    }

    // Sort: biggest deviations first, cap at 5 nudges
    return results
      .sort((a, b) => Math.abs(b.pctDiff) - Math.abs(a.pctDiff))
      .slice(0, 5)
  }, [expenses, selectedMonth, selectedYear])

  const visibleNudges = nudges.filter(n => !dismissed.has(n.category))

  if (visibleNudges.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold font-heading text-slate-700 dark:text-slate-200">Spending Insights</h3>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {visibleNudges.map(({ category, avg, current, pctDiff }) => {
            const isOver = pctDiff > 0
            const isOverall = category === '__overall__'
            const emoji = isOverall ? '📊' : (CATEGORY_EMOJIS[category] || '📦')
            const label = isOverall ? 'Overall spending' : category
            const absPct = Math.abs(pctDiff).toFixed(0)

            const message = isOver
              ? `${absPct}% more than your usual ₹${avg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
              : `${absPct}% less than your usual ₹${avg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

            const colorConfig = isOver
              ? { bg: 'bg-rose-500/8 border-rose-500/20', text: 'text-rose-300', icon: TrendingUp, badge: 'bg-rose-500/15 text-rose-400' }
              : { bg: 'bg-emerald-500/8 border-emerald-500/20', text: 'text-emerald-300', icon: TrendingDown, badge: 'bg-emerald-500/15 text-emerald-400' }

            const { icon: Icon } = colorConfig

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${colorConfig.bg}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base flex-shrink-0">{emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium font-body text-slate-700 dark:text-slate-200">
                        {label}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${colorConfig.badge}`}>
                        <Icon className="w-3 h-3" />
                        {isOver ? '+' : '-'}{absPct}%
                      </span>
                    </div>
                    <p className={`text-xs font-body mt-0.5 ${colorConfig.text}`}>
                      ₹{current.toLocaleString('en-IN', { maximumFractionDigits: 0 })} this month — {message}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDismissed(d => new Set([...d, category]))}
                  className="p-1 rounded-lg text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
