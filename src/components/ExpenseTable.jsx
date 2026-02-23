import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Receipt, Pencil, Search, X, ArrowUpDown, SlidersHorizontal } from 'lucide-react'
import EditExpenseModal from './EditExpenseModal'

const CATEGORY_CONFIG = {
  'Food & Dining':  { emoji: '🍽️', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/25' },
  'Groceries':      { emoji: '🛒', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25' },
  'Housing/Rent':   { emoji: '🏠', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/25' },
  'Transport':      { emoji: '🚗', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/25' },
  'Shopping':       { emoji: '🛍️', bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/25' },
  'Entertainment':  { emoji: '🎭', bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/25' },
  'Health':         { emoji: '💊', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/25' },
  'Utilities':      { emoji: '⚡', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/25' },
  'Subscriptions':  { emoji: '📱', bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/25' },
  'Education':      { emoji: '📚', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/25' },
  'Travel':         { emoji: '✈️', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/25' },
  'Personal Care':  { emoji: '💅', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/25' },
  'Gifts':          { emoji: '🎁', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/25' },
  'Other':          { emoji: '📦', bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/25' },
}

const SORT_OPTIONS = [
  { value: 'date-desc',    label: 'Newest first' },
  { value: 'date-asc',     label: 'Oldest first' },
  { value: 'amount-desc',  label: 'Highest amount' },
  { value: 'amount-asc',   label: 'Lowest amount' },
]

function formatDate(date) {
  if (!date) return '—'
  const d = date instanceof Date ? date : new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

function CategoryBadge({ category }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Other']
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <span>{config.emoji}</span>
      <span className="hidden sm:inline">{category}</span>
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-slate-800/80 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  )
}

// Reusable styled select
function FilterSelect({ value, onChange, children, icon: Icon }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`appearance-none bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 font-body pr-7 py-2 cursor-pointer hover:border-slate-600 [color-scheme:dark] ${
          Icon ? 'pl-8' : 'pl-3'
        }`}
      >
        {children}
      </select>
      {/* Chevron */}
      <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

export default function ExpenseTable({ expenses, onDelete, onUpdate, loading, selectedMonth, selectedYear }) {
  const [editingExpense, setEditingExpense] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [showFilters, setShowFilters] = useState(false)

  const isFiltered = search.trim() !== '' || categoryFilter !== 'all' || sortBy !== 'date-desc'

  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setSortBy('date-desc')
  }

  // Step 1: Filter by selected month
  const monthExpenses = useMemo(() => {
    if (selectedMonth === null || selectedMonth === undefined) return expenses
    return expenses.filter((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date)
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
    })
  }, [expenses, selectedMonth, selectedYear])

  // Unique categories present in current month's data
  const availableCategories = useMemo(() => {
    const cats = [...new Set(monthExpenses.map(e => e.category))].sort()
    return cats
  }, [monthExpenses])

  // Step 2: Apply search + category filter + sort
  const displayedExpenses = useMemo(() => {
    let result = monthExpenses

    // Search: match description or vendor
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(e =>
        e.description?.toLowerCase().includes(q) ||
        e.vendor?.toLowerCase().includes(q) ||
        e.text?.toLowerCase().includes(q)
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter)
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':    return new Date(a.date) - new Date(b.date)
        case 'date-desc':   return new Date(b.date) - new Date(a.date)
        case 'amount-desc': return b.amount - a.amount
        case 'amount-asc':  return a.amount - b.amount
        default:            return 0
      }
    })

    return result
  }, [monthExpenses, search, categoryFilter, sortBy])

  // Total of filtered results
  const filteredTotal = useMemo(
    () => displayedExpenses.reduce((s, e) => s + e.amount, 0),
    [displayedExpenses]
  )

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-white/5 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold font-heading text-slate-200">Transactions</h3>
            <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/50">
              {displayedExpenses.length}
              {displayedExpenses.length !== monthExpenses.length && (
                <span className="text-slate-600"> / {monthExpenses.length}</span>
              )}
            </span>
          </div>

          {/* Toggle filters button (mobile) */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`sm:hidden flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 font-body ${
              isFiltered
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {isFiltered && '•'}
          </button>

          {/* Desktop filter controls */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl pl-8 pr-8 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 font-body w-40 hover:border-slate-600"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category */}
            <FilterSelect value={categoryFilter} onChange={setCategoryFilter}>
              <option value="all">All categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat]?.emoji} {cat}
                </option>
              ))}
            </FilterSelect>

            {/* Sort */}
            <FilterSelect value={sortBy} onChange={setSortBy} icon={ArrowUpDown}>
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </FilterSelect>

            {/* Clear */}
            <AnimatePresence>
              {isFiltered && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-2 rounded-lg hover:bg-white/5 border border-slate-700/60 hover:border-slate-600 transition-all duration-200 font-body"
                >
                  <X className="w-3 h-3" />
                  Clear
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Mobile filter panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden sm:hidden border-b border-white/5"
            >
              <div className="px-5 py-4 flex flex-col gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by description or vendor..."
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-all duration-200 font-body"
                  />
                </div>

                <div className="flex gap-2">
                  {/* Category */}
                  <div className="flex-1">
                    <FilterSelect value={categoryFilter} onChange={setCategoryFilter}>
                      <option value="all">All categories</option>
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {CATEGORY_CONFIG[cat]?.emoji} {cat}
                        </option>
                      ))}
                    </FilterSelect>
                  </div>

                  {/* Sort */}
                  <div className="flex-1">
                    <FilterSelect value={sortBy} onChange={setSortBy} icon={ArrowUpDown}>
                      {SORT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </FilterSelect>
                  </div>
                </div>

                {isFiltered && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-white py-2 rounded-xl hover:bg-white/5 border border-slate-700/60 transition-all duration-200 font-body"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Active filter pills ── */}
        <AnimatePresence>
          {isFiltered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 py-2.5 border-b border-white/5 flex flex-wrap items-center gap-2"
            >
              <span className="text-xs text-slate-500 font-body">Showing:</span>

              {search.trim() && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-body">
                  "{search.trim()}"
                  <button onClick={() => setSearch('')}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}

              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-body">
                  {CATEGORY_CONFIG[categoryFilter]?.emoji} {categoryFilter}
                  <button onClick={() => setCategoryFilter('all')}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}

              {sortBy !== 'date-desc' && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-body">
                  {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                  <button onClick={() => setSortBy('date-desc')}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}

              {displayedExpenses.length > 0 && (
                <span className="ml-auto text-xs text-slate-500 font-body">
                  Total: <span className="text-slate-300 font-heading">₹{filteredTotal.toFixed(2)}</span>
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3 font-heading">Date</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 font-heading">Description</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 font-heading hidden sm:table-cell">Vendor</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 font-heading">Category</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3 font-heading">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading && <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>}

              {!loading && displayedExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-800/60 rounded-2xl flex items-center justify-center">
                        {isFiltered
                          ? <Search className="w-6 h-6 text-slate-600" />
                          : <Receipt className="w-6 h-6 text-slate-600" />
                        }
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium font-heading">
                          {isFiltered ? 'No matching transactions' : 'No expenses yet'}
                        </p>
                        <p className="text-slate-600 text-sm mt-1 font-body">
                          {isFiltered
                            ? <button onClick={clearFilters} className="text-blue-400 hover:underline">Clear filters</button>
                            : 'Type an expense above to get started'
                          }
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              <AnimatePresence initial={false}>
                {!loading && displayedExpenses.map((expense) => (
                  <motion.tr
                    key={expense.id}
                    layout
                    initial={{ opacity: 0, x: -10, backgroundColor: 'rgba(59, 130, 246, 0.08)' }}
                    animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0, 0, 0, 0)' }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors duration-150"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-400 font-body whitespace-nowrap">
                        {formatDate(expense.date)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 max-w-[180px]">
                      <p className="text-sm text-white font-medium truncate font-body">
                        {expense.description}
                      </p>
                      {expense.text && (
                        <p className="text-xs text-slate-600 truncate mt-0.5 font-body hidden sm:block">
                          "{expense.text.slice(0, 50)}{expense.text.length > 50 ? '…' : ''}"
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-sm text-slate-300 font-body">
                        {expense.vendor === 'Unknown'
                          ? <span className="text-slate-600 italic">—</span>
                          : expense.vendor
                        }
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <CategoryBadge category={expense.category} />
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-sm font-semibold text-white font-heading tabular-nums mr-2">
                          ₹{expense.amount.toFixed(2)}
                        </span>
                        <motion.button
                          onClick={() => setEditingExpense(expense)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Edit"
                          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-blue-400 transition-all duration-200 p-1 rounded-lg hover:bg-blue-500/10"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          onClick={() => onDelete(expense.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Delete"
                          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all duration-200 p-1 rounded-lg hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      <EditExpenseModal
        expense={editingExpense}
        onSave={onUpdate}
        onClose={() => setEditingExpense(null)}
      />
    </>
  )
}
