import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl px-3 py-2.5 shadow-xl backdrop-blur text-sm">
      <p className="text-slate-400 text-xs font-body">{label}</p>
      <p className="text-white font-semibold font-heading">
        ₹{Number(payload[0]?.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  )
}

export default function MonthlyTrends({ expenses, selectedMonth, selectedYear }) {
  const { monthlyData, current, prev, pct, dir } = useMemo(() => {
    const now = new Date()
    const selMonth = selectedMonth ?? now.getMonth()
    const selYear = selectedYear ?? now.getFullYear()

    // Build last 6 months ending at selected month
    const months = []
    for (let i = 5; i >= 0; i--) {
      let m = selMonth - i
      let y = selYear
      while (m < 0) { m += 12; y-- }
      months.push({ m, y })
    }

    const monthlyData = months.map(({ m, y }) => {
      const total = expenses
        .filter(e => {
          const d = e.date instanceof Date ? e.date : new Date(e.date)
          return d.getMonth() === m && d.getFullYear() === y
        })
        .reduce((s, e) => s + e.amount, 0)
      return {
        label: `${MONTH_SHORT[m]} '${String(y).slice(2)}`,
        amount: Math.round(total * 100) / 100,
        isCurrent: m === selMonth && y === selYear,
      }
    })

    const current = monthlyData[5].amount
    const prev = monthlyData[4].amount

    let pct = 0
    let dir = 'neutral'
    if (prev > 0) {
      pct = ((current - prev) / prev) * 100
      dir = pct > 2 ? 'up' : pct < -2 ? 'down' : 'neutral'
    } else if (current > 0) {
      dir = 'up'
      pct = 100
    }

    return { monthlyData, current, prev, pct, dir }
  }, [expenses, selectedMonth, selectedYear])

  const hasData = monthlyData.some(d => d.amount > 0)

  const trendConfig = {
    up: {
      Icon: TrendingUp,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      label: `${Math.abs(pct).toFixed(1)}% more than last month`,
    },
    down: {
      Icon: TrendingDown,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      label: `${Math.abs(pct).toFixed(1)}% less than last month`,
    },
    neutral: {
      Icon: Minus,
      color: 'text-slate-400',
      bg: 'bg-slate-800/40 border-slate-700/40',
      label: 'Similar to last month',
    },
  }[dir]

  const { Icon } = trendConfig

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold font-heading text-slate-200">
            Monthly Spending Trend
          </h3>
        </div>

        {hasData && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold font-heading ${trendConfig.bg} ${trendConfig.color}`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{trendConfig.label}</span>
          </div>
        )}
      </div>

      {/* Chart */}
      {!hasData ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-slate-600 text-sm font-body">No spending data yet</p>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: '"DM Sans", sans-serif' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: '"DM Sans", sans-serif' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                width={48}
              />
              <Tooltip
                content={<TrendTooltip />}
                cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#trendGradient)"
                dot={({ cx, cy, payload, key }) => (
                  <circle
                    key={key}
                    cx={cx}
                    cy={cy}
                    r={payload.isCurrent ? 5 : 3}
                    fill="#3b82f6"
                    fillOpacity={payload.isCurrent ? 1 : 0.5}
                    stroke={payload.isCurrent ? '#1d4ed8' : 'none'}
                    strokeWidth={payload.isCurrent ? 2 : 0}
                  />
                )}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Previous vs current comparison */}
      {(prev > 0 || current > 0) && (
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 font-body mb-0.5">
              {monthlyData[4]?.label}
            </p>
            <p className="text-lg font-semibold font-heading text-slate-300">
              ₹{prev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-body mb-0.5">
              {monthlyData[5]?.label}{' '}
              <span className="text-blue-500">(selected)</span>
            </p>
            <p className="text-lg font-semibold font-heading text-white">
              ₹{current.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
