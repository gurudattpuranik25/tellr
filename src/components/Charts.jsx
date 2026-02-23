import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { PieChart as PieIcon, BarChart2 } from 'lucide-react'

const CATEGORY_COLORS = {
  'Food & Dining':  '#f97316',
  'Groceries':      '#10b981',
  'Housing/Rent':   '#a855f7',
  'Transport':      '#3b82f6',
  'Shopping':       '#ec4899',
  'Entertainment':  '#eab308',
  'Health':         '#ef4444',
  'Utilities':      '#06b6d4',
  'Subscriptions':  '#8b5cf6',
  'Education':      '#6366f1',
  'Travel':         '#0ea5e9',
  'Personal Care':  '#f43f5e',
  'Gifts':          '#f59e0b',
  'Other':          '#64748b',
}

const CATEGORY_EMOJIS = {
  'Food & Dining': '🍽️', 'Groceries': '🛒', 'Housing/Rent': '🏠',
  'Transport': '🚗', 'Shopping': '🛍️', 'Entertainment': '🎭',
  'Health': '💊', 'Utilities': '⚡', 'Subscriptions': '📱',
  'Education': '📚', 'Travel': '✈️', 'Personal Care': '💅',
  'Gifts': '🎁', 'Other': '📦',
}

function formatDay(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
    .replace(/\d{4}/, '').replace(/, $/, '')
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl px-3 py-2.5 shadow-xl backdrop-blur text-sm">
      <p className="text-white font-semibold font-heading">{d.name}</p>
      <p className="text-slate-300 font-body">₹{Number(d.value).toFixed(2)}</p>
    </div>
  )
}

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl px-3 py-2.5 shadow-xl backdrop-blur text-sm">
      <p className="text-slate-400 text-xs font-body">{label}</p>
      <p className="text-white font-semibold font-heading">₹{Number(payload[0]?.value || 0).toFixed(2)}</p>
    </div>
  )
}

export default function Charts({ expenses, selectedMonth, selectedYear }) {
  const { categoryData, dailyData } = useMemo(() => {
    const now = new Date()
    const month = selectedMonth ?? now.getMonth()
    const year = selectedYear ?? now.getFullYear()

    // Filter for selected month
    const monthExpenses = expenses.filter((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date)
      return d.getMonth() === month && d.getFullYear() === year
    })

    // Category totals for pie chart
    const catMap = monthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})
    const categoryData = Object.entries(catMap)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)

    // Last 7 days bar chart (always current)
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      days.push(d)
    }

    const dailyData = days.map((day) => {
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)
      const total = expenses
        .filter((e) => {
          const ed = e.date instanceof Date ? e.date : new Date(e.date)
          return ed >= day && ed <= dayEnd
        })
        .reduce((s, e) => s + e.amount, 0)
      return {
        day: formatDay(day),
        amount: Math.round(total * 100) / 100,
      }
    })

    return { categoryData, dailyData }
  }, [expenses, selectedMonth, selectedYear])

  const hasData = categoryData.length > 0
  const hasDailyData = dailyData.some(d => d.amount > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Donut Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <PieIcon className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold font-heading text-slate-200">
            Spending by Category
          </h3>
        </div>

        {!hasData ? (
          <div className="h-52 flex items-center justify-center">
            <p className="text-slate-600 text-sm font-body">No data for this period</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-48 h-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CATEGORY_COLORS[entry.name] || '#64748b'}
                        opacity={0.85}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categoryData.slice(0, 8).map((entry) => {
                const total = categoryData.reduce((s, d) => s + d.value, 0)
                const pct = total ? ((entry.value / total) * 100).toFixed(0) : 0
                return (
                  <div key={entry.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[entry.name] || '#64748b' }}
                      />
                      <span className="text-xs text-slate-400 font-body truncate">
                        {CATEGORY_EMOJIS[entry.name]} {entry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-600 font-body">{pct}%</span>
                      <span className="text-xs font-medium text-white font-heading">
                        ₹{entry.value.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}
              {categoryData.length > 8 && (
                <p className="text-xs text-slate-600 font-body pt-1">
                  +{categoryData.length - 8} more categories
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold font-heading text-slate-200">
            Daily Spending — Last 7 Days
          </h3>
        </div>

        {!hasDailyData ? (
          <div className="h-52 flex items-center justify-center">
            <p className="text-slate-600 text-sm font-body">No spending in the last 7 days</p>
          </div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barCategoryGap="30%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: '"DM Sans", sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: '"DM Sans", sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                  width={45}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  )
}
