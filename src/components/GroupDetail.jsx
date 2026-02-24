import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plus, Trash2, Users, CheckCircle2,
  Loader2, Search, X, Receipt, Pencil, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'

import Navbar from './Navbar'
import AddGroupExpense from './AddGroupExpense'
import { useAuth } from '../hooks/useAuth'
import { useGroupDetail } from '../hooks/useGroupDetail'
import {
  deleteGroupExpense, addSettlement, addMemberToGroup,
  updateGroupName, deleteGroup,
} from '../services/groupService'
import { findUserByEmail } from '../services/userService'

const CATEGORY_EMOJIS = {
  'Food & Dining': '🍽️', 'Groceries': '🛒', 'Housing/Rent': '🏠',
  'Transport': '🚗', 'Shopping': '🛍️', 'Entertainment': '🎭',
  'Health': '💊', 'Utilities': '⚡', 'Subscriptions': '📱',
  'Education': '📚', 'Travel': '✈️', 'Personal Care': '💅',
  'Gifts': '🎁', 'Other': '📦',
}

function Avatar({ member, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  if (member.photoURL) {
    return <img src={member.photoURL} alt={member.displayName} className={`${sz} rounded-full ring-2 ring-slate-200 dark:ring-slate-800 object-cover`} />
  }
  return (
    <div className={`${sz} rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center font-semibold text-blue-300`}>
      {(member.displayName || member.email || '?')[0].toUpperCase()}
    </div>
  )
}

function AddMemberModal({ groupId, existingUids, onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    if (existingUids.includes(trimmed)) { toast.error('Already a member'); return }
    setLoading(true)
    try {
      const found = await findUserByEmail(trimmed)
      if (!found) { toast.error('No user found with that email'); return }
      if (existingUids.includes(found.uid)) { toast.error('Already a member'); return }
      await addMemberToGroup(groupId, found)
      toast.success(`${found.displayName || found.email} added!`)
      onClose()
    } catch {
      toast.error('Failed to add member')
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
        className="glass-card w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold font-heading text-slate-900 dark:text-white">Add Member</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="friend@example.com"
            autoFocus
            className="flex-1 bg-white/80 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500/60 font-body"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !email.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function BalanceCard({ debt, currentUid, groupId, onSettled }) {
  const [loading, setLoading] = useState(false)
  const isYouDebtor = debt.from === currentUid
  const isYouCreditor = debt.to === currentUid
  const isYourDebt = isYouDebtor || isYouCreditor

  const handleSettle = async () => {
    setLoading(true)
    try {
      await addSettlement(groupId, {
        from: debt.from,
        fromName: debt.fromName,
        to: debt.to,
        toName: debt.toName,
        amount: debt.amount,
      })
      toast.success('Marked as settled! 🎉')
      onSettled?.()
    } catch {
      toast.error('Failed to record settlement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
        isYouDebtor
          ? 'bg-rose-500/6 border-rose-500/20'
          : isYouCreditor
          ? 'bg-emerald-500/6 border-emerald-500/20'
          : 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40'
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium font-body text-slate-700 dark:text-slate-200">
          {isYouDebtor ? (
            <>You owe <span className="text-rose-400">{debt.toName}</span></>
          ) : isYouCreditor ? (
            <><span className="text-emerald-400">{debt.fromName}</span> owes you</>
          ) : (
            <><span className="text-slate-600 dark:text-slate-300">{debt.fromName}</span> owes <span className="text-slate-600 dark:text-slate-300">{debt.toName}</span></>
          )}
        </p>
        <p className={`text-base font-bold font-heading ${isYouDebtor ? 'text-rose-400' : isYouCreditor ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-300'}`}>
          ₹{debt.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </p>
      </div>
      {isYourDebt && (
        <button
          onClick={handleSettle}
          disabled={loading}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600/50 text-slate-600 dark:text-slate-300 text-xs font-medium font-body hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          Settle
        </button>
      )}
    </motion.div>
  )
}

export default function GroupDetail() {
  const { id: groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { group, expenses, balances, loading } = useGroupDetail(groupId)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  // Rename state
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteExpense = async (expenseId) => {
    try {
      await deleteGroupExpense(groupId, expenseId)
      toast.success('Expense removed')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleRename = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === group.name) { setIsEditingName(false); return }
    setSavingName(true)
    try {
      await updateGroupName(groupId, trimmed)
      toast.success('Group renamed')
      setIsEditingName(false)
    } catch {
      toast.error('Failed to rename group')
    } finally {
      setSavingName(false)
    }
  }

  const handleDeleteGroup = async () => {
    setDeleting(true)
    try {
      await deleteGroup(groupId)
      toast.success('Group deleted')
      navigate('/groups')
    } catch {
      toast.error('Failed to delete group')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 text-slate-400 dark:text-slate-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-400 font-body">Group not found.</p>
          <button onClick={() => navigate('/groups')} className="mt-4 text-blue-400 text-sm">← Back to Groups</button>
        </div>
      </div>
    )
  }

  const myBalances = balances.filter((d) => d.from === user?.uid || d.to === user?.uid)
  const otherBalances = balances.filter((d) => d.from !== user?.uid && d.to !== user?.uid)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back + header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate('/groups')}
            className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-body mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Groups
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              {/* Group name — inline editable */}
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename()
                      if (e.key === 'Escape') setIsEditingName(false)
                    }}
                    autoFocus
                    className="text-2xl font-heading font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none min-w-0 w-full max-w-[200px] sm:max-w-[256px]"
                  />
                  <button
                    onClick={handleRename}
                    disabled={savingName || !nameInput.trim()}
                    className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 disabled:opacity-40 transition-all"
                  >
                    {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">{group.name}</h2>
                  <button
                    onClick={() => { setNameInput(group.name); setIsEditingName(true) }}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-700 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
                    title="Rename group"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <div className="flex -space-x-2">
                  {(group.members || []).slice(0, 6).map((m) => (
                    <Avatar key={m.uid} member={m} />
                  ))}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-body ml-1">
                  {group.members?.length || 1} member{(group.members?.length || 1) !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="text-xs text-blue-500 hover:text-blue-400 font-body transition-colors"
                >
                  + Add member
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setShowAddExpense(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold font-heading transition-colors shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
              <button
                onClick={() => setShowDeleteConfirm((v) => !v)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all"
                title="Delete group"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Delete confirmation bar */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-rose-500/8 border border-rose-500/25">
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-body">
                    Delete <span className="text-slate-900 dark:text-white font-medium">"{group.name}"</span>? All expenses and balances will be permanently removed.
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium font-body text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/60 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteGroup}
                      disabled={deleting}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold font-body text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Delete group
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Balances */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold font-heading text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="text-base">💸</span> Balances
          </h3>

          {balances.length === 0 ? (
            <div className="flex items-center gap-2 py-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-sm text-emerald-400 font-body">All settled up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myBalances.map((debt, i) => (
                <BalanceCard key={i} debt={debt} currentUid={user?.uid} groupId={groupId} />
              ))}
              {otherBalances.length > 0 && myBalances.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700/40 pt-2 mt-2" />
              )}
              {otherBalances.map((debt, i) => (
                <BalanceCard key={`other-${i}`} debt={debt} currentUid={user?.uid} groupId={groupId} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold font-heading text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-400 dark:text-slate-400" />
            Expenses
            {expenses.length > 0 && (
              <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-body font-normal">
                {expenses.length} total · ₹{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
              </span>
            )}
          </h3>

          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 dark:text-slate-500 text-sm font-body">No expenses yet.</p>
              <button
                onClick={() => setShowAddExpense(true)}
                className="mt-3 text-blue-500 hover:text-blue-400 text-sm font-body transition-colors"
              >
                Add the first expense
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp, i) => {
                const myShare = exp.splits?.find((s) => s.uid === user?.uid)
                const paidByMe = exp.paidBy === user?.uid
                return (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 hover:border-slate-300 dark:hover:border-slate-600/40 transition-colors"
                  >
                    <span className="text-lg flex-shrink-0">
                      {CATEGORY_EMOJIS[exp.category] || '📦'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 font-body truncate">{exp.description}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-body">
                        {paidByMe ? 'You paid' : `${exp.paidByName} paid`}
                        {myShare && !paidByMe && (
                          <span className="text-slate-400 dark:text-slate-600"> · your share ₹{myShare.amount}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold font-heading text-slate-900 dark:text-white tabular-nums">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-600 font-body">{exp.date}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-700 hover:text-rose-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showAddExpense && (
          <AddGroupExpense group={group} currentUser={user} onClose={() => setShowAddExpense(false)} />
        )}
        {showAddMember && (
          <AddMemberModal
            groupId={groupId}
            existingUids={group.members?.map((m) => m.uid) || []}
            onClose={() => setShowAddMember(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
