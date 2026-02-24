import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, IndianRupee, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'
import { addGroupExpense } from '../services/groupService'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const CATEGORIES = [
  'Food & Dining', 'Groceries', 'Housing/Rent', 'Transport', 'Shopping',
  'Entertainment', 'Health', 'Utilities', 'Subscriptions', 'Education',
  'Travel', 'Personal Care', 'Gifts', 'Other',
]

const CATEGORY_EMOJIS = {
  'Food & Dining': '🍽️', 'Groceries': '🛒', 'Housing/Rent': '🏠',
  'Transport': '🚗', 'Shopping': '🛍️', 'Entertainment': '🎭',
  'Health': '💊', 'Utilities': '⚡', 'Subscriptions': '📱',
  'Education': '📚', 'Travel': '✈️', 'Personal Care': '💅',
  'Gifts': '🎁', 'Other': '📦',
}

export default function AddGroupExpense({ group, currentUser, onClose }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [category, setCategory] = useState('Food & Dining')
  const [paidBy, setPaidBy] = useState(currentUser.uid)
  const [splitMode, setSplitMode] = useState('equal') // 'equal' | 'custom'
  const [excludedUids, setExcludedUids] = useState(new Set())
  const [customAmounts, setCustomAmounts] = useState({})
  const [loading, setLoading] = useState(false)

  const members = group.members || []
  const parsedAmount = parseFloat(amount) || 0

  // Included members (equal mode)
  const includedMembers = useMemo(
    () => members.filter(m => !excludedUids.has(m.uid)),
    [members, excludedUids]
  )

  // Per-person amount for equal mode
  const equalEach = useMemo(() => {
    if (includedMembers.length === 0 || parsedAmount <= 0) return 0
    return Math.round((parsedAmount / includedMembers.length) * 100) / 100
  }, [parsedAmount, includedMembers.length])

  // Running total for custom mode
  const customSum = useMemo(
    () => members.reduce((acc, m) => acc + (parseFloat(customAmounts[m.uid]) || 0), 0),
    [customAmounts, members]
  )

  // Build the final splits array + validity flag
  const { splits, splitValid } = useMemo(() => {
    if (splitMode === 'equal') {
      if (includedMembers.length === 0) return { splits: [], splitValid: false }
      // Last member absorbs rounding difference
      const base = Math.round((parsedAmount / includedMembers.length) * 100) / 100
      const built = includedMembers.map((m, i) => ({
        uid: m.uid,
        name: m.displayName || m.email,
        amount:
          i === includedMembers.length - 1
            ? Math.round((parsedAmount - base * (includedMembers.length - 1)) * 100) / 100
            : base,
      }))
      return { splits: built, splitValid: true }
    } else {
      const built = members
        .map(m => ({
          uid: m.uid,
          name: m.displayName || m.email,
          amount: Math.round((parseFloat(customAmounts[m.uid]) || 0) * 100) / 100,
        }))
        .filter(s => s.amount > 0)
      const valid = built.length > 0 && Math.abs(customSum - parsedAmount) < 0.02
      return { splits: built, splitValid: valid }
    }
  }, [splitMode, includedMembers, parsedAmount, members, customAmounts, customSum])

  const toggleExclude = (uid) => {
    setExcludedUids(prev => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!description.trim()) { toast.error('Enter a description'); return }
    if (parsedAmount <= 0) { toast.error('Enter a valid amount'); return }
    if (!splitValid) {
      if (splitMode === 'equal') {
        toast.error('At least one member must be included')
      } else {
        const diff = parsedAmount - customSum
        toast.error(
          diff > 0
            ? `₹${diff.toFixed(2)} still unassigned`
            : `Over by ₹${Math.abs(diff).toFixed(2)} — reduce someone's share`
        )
      }
      return
    }

    const paidByMember = members.find(m => m.uid === paidBy)

    setLoading(true)
    try {
      await addGroupExpense(group.id, {
        description: description.trim(),
        amount: parsedAmount,
        category,
        paidBy,
        paidByName: paidByMember?.displayName || paidByMember?.email || 'Unknown',
        splits,
        date,
      })
      toast.success(`Added "${description.trim()}"`)
      onClose()
    } catch {
      toast.error('Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  const customRemaining = parsedAmount - customSum

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="glass-card w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold font-heading text-slate-900 dark:text-white">Add Expense</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 font-body mb-1.5 block">What was it for?</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dinner, Uber, Groceries..."
            autoFocus
            className="w-full bg-white/80 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500/60 font-body"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 font-body mb-1.5 block">Total amount</label>
          <div className="relative">
            <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full bg-white/80 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500/60 font-body"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 font-body mb-1.5 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Date
          </label>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white/80 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/60 font-body [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 font-body mb-1.5 block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white/80 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/60 font-body appearance-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_EMOJIS[c]} {c}
              </option>
            ))}
          </select>
        </div>

        {/* Who paid */}
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 font-body mb-1.5 block">Who paid?</label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.uid}
                onClick={() => setPaidBy(m.uid)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium font-body border transition-all duration-200 ${
                  paidBy === m.uid
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                    : 'bg-slate-100/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/40 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {m.displayName || m.email}
              </button>
            ))}
          </div>
        </div>

        {/* Split section */}
        <div>
          {/* Mode toggle */}
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-body">Split</label>
            <div className="flex items-center gap-0.5 bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg p-0.5">
              {['equal', 'custom'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setSplitMode(mode)}
                  className={`px-3 py-1 rounded-md text-xs font-medium font-body transition-all capitalize ${
                    splitMode === mode
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Equal split — with include/exclude checkboxes */}
          {splitMode === 'equal' && (
            <div className="space-y-1.5">
              {members.map((m) => {
                const excluded = excludedUids.has(m.uid)
                return (
                  <button
                    key={m.uid}
                    onClick={() => toggleExclude(m.uid)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all duration-150 ${
                      excluded
                        ? 'bg-slate-100/20 dark:bg-slate-800/20 border-slate-200/20 dark:border-slate-700/20 opacity-40'
                        : 'bg-slate-100/40 dark:bg-slate-800/40 border-slate-200/40 dark:border-slate-700/40 hover:border-slate-300/60 dark:hover:border-slate-600/60'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                      !excluded ? 'bg-blue-600 border-blue-500' : 'bg-transparent border-slate-300 dark:border-slate-600'
                    }`}>
                      {!excluded && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                    </div>
                    <span className="flex-1 text-xs text-slate-600 dark:text-slate-300 font-body truncate">
                      {m.displayName || m.email}
                      {m.uid === paidBy && <span className="text-blue-400 ml-1.5 font-medium">paid</span>}
                    </span>
                    <span className={`text-xs font-heading tabular-nums flex-shrink-0 ${excluded ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-300'}`}>
                      {excluded || parsedAmount <= 0 ? '—' : `₹${equalEach}`}
                    </span>
                  </button>
                )
              })}
              {parsedAmount > 0 && includedMembers.length > 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-600 font-body text-right pt-0.5">
                  ₹{equalEach} × {includedMembers.length}{includedMembers.length !== members.length ? ` of ${members.length}` : ''} people
                </p>
              )}
            </div>
          )}

          {/* Custom split — per-member amount inputs */}
          {splitMode === 'custom' && (
            <div className="space-y-1.5">
              {members.map((m) => (
                <div key={m.uid} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40">
                  <span className="flex-1 text-xs text-slate-600 dark:text-slate-300 font-body truncate">
                    {m.displayName || m.email}
                    {m.uid === paidBy && <span className="text-blue-400 ml-1.5 font-medium">paid</span>}
                  </span>
                  <div className="relative flex-shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[11px]">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={customAmounts[m.uid] || ''}
                      onChange={(e) => setCustomAmounts(prev => ({ ...prev, [m.uid]: e.target.value }))}
                      placeholder="0"
                      className="w-24 bg-white/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 font-heading tabular-nums"
                    />
                  </div>
                </div>
              ))}

              {/* Running total */}
              {parsedAmount > 0 && (
                <div className={`flex items-center justify-between text-xs font-body px-1 pt-0.5 ${
                  Math.abs(customRemaining) < 0.02 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  <span>Assigned: ₹{customSum.toFixed(2)} / ₹{parsedAmount}</span>
                  {Math.abs(customRemaining) >= 0.02 && (
                    <span>{customRemaining > 0 ? `₹${customRemaining.toFixed(2)} left` : `₹${Math.abs(customRemaining).toFixed(2)} over`}</span>
                  )}
                  {Math.abs(customRemaining) < 0.02 && <span>✓ Balanced</span>}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !description.trim() || parsedAmount <= 0 || !splitValid}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold font-heading transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Add Expense
        </button>
      </motion.div>
    </motion.div>
  )
}
