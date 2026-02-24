import { useMemo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { IndianRupee, TrendingUp, Tag, Receipt } from 'lucide-react'

const CATEGORY_EMOJIS = {
  'Food & Dining': '🍽️',
  'Groceries': '🛒',
  'Housing/Rent': '🏠',
  'Transport': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎭',
  'Health': '💊',
  'Utilities': '⚡',
  'Subscriptions': '📱',
  'Education': '📚',
  'Travel': '✈️',
  'Personal Care': '💅',
  'Gifts': '🎁',
  'Other': '📦',
}

function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) { setCount(0); return }
    const start = Date.now()
    const startVal = count
    const step = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(startVal + (target - startVal) * eased)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return count
}

function StatCard({ icon: Icon, label, value, subValue, iconColor, delay = 0, trend }) {
  const trendStyles = {
    up:      { cls: 'bg-rose-500/10 border-rose-500/20 text-rose-400',     arrow: '▲' },
    down:    { cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', arrow: '▼' },
    neutral: { cls: 'bg-slate-800/40 border-slate-700/40 text-slate-500',   arrow: '●' },
  }
  const ts = trend ? trendStyles[trend.direction] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="glass-card p-5 flex flex-col gap-4 hover:border-white/20 transition-all duration-300 cursor-default"
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        {subValue && (
          <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/50">
            {subValue}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold font-heading text-white leading-none">{value}</p>
        <p className="text-sm text-slate-400 mt-1 font-body">{label}</p>
        {trend && ts && (
          <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${ts.cls}`}>
            <span>{ts.arrow}</span>
            <span className="font-body">{trend.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function SummaryCards({ expenses, selectedMonth, selectedYear }) {
  const stats = useMemo(() => {
    const now = new Date()
    const month = selectedMonth ?? now.getMonth()
    const year = selectedYear ?? now.getFullYear()

    const monthExpenses = expenses.filter((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date)
      return d.getMonth() === month && d.getFullYear() === year
    })

    const today = new Date()
    const todayExpenses = expenses.filter((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date)
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      )
    })

    const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0)
    const totalToday = todayExpenses.reduce((s, e) => s + e.amount, 0)
    const txCount = monthExpenses.length

    // Top category by total
    const catTotals = monthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})
    const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // Previous month for trend badge
    const prevM = month === 0 ? 11 : month - 1
    const prevY = month === 0 ? year - 1 : year
    const prevTotal = expenses
      .filter(e => {
        const d = e.date instanceof Date ? e.date : new Date(e.date)
        return d.getMonth() === prevM && d.getFullYear() === prevY
      })
      .reduce((s, e) => s + e.amount, 0)

    let monthTrend = null
    if (prevTotal > 0) {
      const pct = ((totalMonth - prevTotal) / prevTotal) * 100
      const direction = Math.abs(pct) < 2 ? 'neutral' : pct > 0 ? 'up' : 'down'
      monthTrend = {
        direction,
        label: direction === 'neutral'
          ? 'vs last month'
          : `${Math.abs(pct).toFixed(1)}% vs last month`,
      }
    }

    return { totalMonth, totalToday, txCount, topCategory, monthTrend }
  }, [expenses, selectedMonth, selectedYear])

  const monthTotal = useCountUp(stats.totalMonth)
  const todayTotal = useCountUp(stats.totalToday)
  const txCount = useCountUp(stats.txCount)
  const { monthTrend } = stats

  const isCurrentMonth = () => {
    const now = new Date()
    return (selectedMonth ?? now.getMonth()) === now.getMonth() &&
           (selectedYear ?? now.getFullYear()) === now.getFullYear()
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard
        icon={IndianRupee}
        label="Monthly Spending"
        value={`₹${monthTotal.toFixed(2)}`}
        subValue="this month"
        iconColor="bg-blue-500/20 text-blue-400"
        delay={0}
        trend={monthTrend}
      />
      <StatCard
        icon={TrendingUp}
        label="Today's Spending"
        value={`₹${todayTotal.toFixed(2)}`}
        subValue={isCurrentMonth() ? 'today' : undefined}
        iconColor="bg-emerald-500/20 text-emerald-400"
        delay={0.05}
      />
      <StatCard
        icon={Tag}
        label="Top Category"
        value={
          stats.topCategory
            ? `${CATEGORY_EMOJIS[stats.topCategory] || '📦'} ${stats.topCategory}`
            : '—'
        }
        subValue="by spend"
        iconColor="bg-purple-500/20 text-purple-400"
        delay={0.1}
      />
      <StatCard
        icon={Receipt}
        label="Transactions"
        value={Math.round(txCount)}
        subValue="this month"
        iconColor="bg-amber-500/20 text-amber-400"
        delay={0.15}
      />
    </div>
  )
}
