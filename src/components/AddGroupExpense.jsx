import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import { addGroupExpense } from '../services/groupService'

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
  const [category, setCategory] = useState('Food & Dining')
  const [paidBy, setPaidBy] = useState(currentUser.uid)
  const [loading, setLoading] = useState(false)

  const members = group.members || []
  const parsedAmount = parseFloat(amount) || 0
  const splitAmount = members.length > 0 ? Math.round((parsedAmount / members.length) * 100) / 100 : 0

  // Build splits array — equal share for all members
  const splits = members.map((m) => ({ uid: m.uid, name: m.displayName || m.email, amount: splitAmount }))

  const handleSubmit = async () => {
    if (!description.trim()) { toast.error('Enter a description'); return }
    if (parsedAmount <= 0) { toast.error('Enter a valid amount'); return }

    const paidByMember = members.find((m) => m.uid === paidBy)

    setLoading(true)
    try {
      await addGroupExpense(group.id, {
        description: description.trim(),
        amount: parsedAmount,
        category,
        paidBy,
        paidByName: paidByMember?.displayName || paidByMember?.email || 'Unknown',
        splits,
        date: new Date().toISOString().split('T')[0],
      })
      toast.success(`Added "${description.trim()}"`)
      onClose()
    } catch {
      toast.error('Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

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
        className="glass-card w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold font-heading text-white">Add Expense</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-slate-400 font-body mb-1.5 block">What was it for?</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dinner, Uber, Groceries..."
            autoFocus
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 font-body"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-slate-400 font-body mb-1.5 block">Total amount</label>
          <div className="relative">
            <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 font-body"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs text-slate-400 font-body mb-1.5 block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60 font-body appearance-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ background: '#0f172a' }}>
                {CATEGORY_EMOJIS[c]} {c}
              </option>
            ))}
          </select>
        </div>

        {/* Who paid */}
        <div>
          <label className="text-xs text-slate-400 font-body mb-1.5 block">Who paid?</label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.uid}
                onClick={() => setPaidBy(m.uid)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium font-body border transition-all duration-200 ${
                  paidBy === m.uid
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                {m.displayName || m.email}
              </button>
            ))}
          </div>
        </div>

        {/* Split preview */}
        {parsedAmount > 0 && (
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <p className="text-xs text-slate-400 font-body mb-2">Split equally — ₹{splitAmount} each</p>
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => (
                <span key={m.uid} className="text-xs px-2 py-1 rounded-lg bg-slate-700/50 text-slate-300 font-body">
                  {m.uid === paidBy ? '✓ ' : ''}{m.displayName || m.email} ₹{splitAmount}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !description.trim() || parsedAmount <= 0}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold font-heading transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Add Expense
        </button>
      </motion.div>
    </motion.div>
  )
}
