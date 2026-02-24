import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Wallet, Users, CheckCircle2, ChevronRight } from 'lucide-react'
import MagicInput from './MagicInput'
import { setBudget } from '../services/budgetService'
import { createGroup } from '../services/groupService'
import { markOnboardingComplete } from '../services/userService'

const CATEGORIES = [
  'Food & Dining', 'Groceries', 'Housing/Rent', 'Transport', 'Shopping',
  'Entertainment', 'Health', 'Utilities', 'Subscriptions', 'Education',
  'Travel', 'Personal Care', 'Gifts', 'Other',
]

const STEP_ICONS = [Sparkles, Wallet, Wallet, Users]

export default function OnboardingModal({ user, onAddExpense, onComplete }) {
  const [step, setStep] = useState(1)
  const [expenseAdded, setExpenseAdded] = useState(false)
  const [budgetCategory, setBudgetCategory] = useState('Food & Dining')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)

  const advance = () => setStep(s => s + 1)

  const finish = async () => {
    await markOnboardingComplete(user.uid)
    onComplete()
  }

  const handleExpense = async (text, date) => {
    await onAddExpense(text, date)
    setExpenseAdded(true)
  }

  const handleSaveBudget = async () => {
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) { advance(); return }
    setLoading(true)
    try {
      await setBudget(user.uid, budgetCategory, parseFloat(budgetAmount))
    } finally {
      setLoading(false)
      advance()
    }
  }

  const handleCreateGroup = async () => {
    const name = groupName.trim()
    if (!name) { finish(); return }
    setLoading(true)
    try {
      await createGroup(name, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      })
    } finally {
      setLoading(false)
      finish()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card max-w-md w-full p-6 relative overflow-hidden"
      >
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map(n => (
            <div
              key={n}
              className={`h-2 rounded-full transition-all duration-300 ${
                n <= step ? 'bg-blue-500 w-6' : 'bg-slate-300 dark:bg-slate-700 w-2'
              }`}
            />
          ))}
          <span className="text-slate-400 dark:text-slate-500 text-xs font-body ml-2">Step {step} of 4</span>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepSlide key="s1" direction={1}>
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mx-auto">
                  <Sparkles className="w-7 h-7 text-blue-400" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
                  Welcome to Tellr 👋
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-body text-sm leading-relaxed">
                  The AI-powered expense tracker that understands plain English.
                </p>
                <ul className="text-left space-y-2.5 mt-4">
                  {[
                    'Type expenses naturally — Claude parses them instantly',
                    'Set budgets per category and track your progress',
                    'Split bills with friends using shared groups',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300 text-sm font-body">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end mt-6">
                <PrimaryButton onClick={advance} icon={<ChevronRight className="w-4 h-4" />}>
                  Get Started
                </PrimaryButton>
              </div>
            </StepSlide>
          )}

          {step === 2 && (
            <StepSlide key="s2" direction={1}>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">Add your first expense</h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-body text-sm">
                  Just type naturally — e.g. "Lunch at Swiggy 350"
                </p>
                <MagicInput onSubmit={handleExpense} />
                <AnimatePresence>
                  {expenseAdded && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 text-emerald-400 text-sm font-body"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Expense added!
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <StepNav
                onSkip={advance}
                onNext={advance}
                nextDisabled={false}
                nextLabel="Next"
              />
            </StepSlide>
          )}

          {step === 3 && (
            <StepSlide key="s3" direction={1}>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">Set a budget</h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-body text-sm">
                  Choose a category and set your monthly limit.
                </p>
                <div className="space-y-3">
                  <select
                    value={budgetCategory}
                    onChange={e => setBudgetCategory(e.target.value)}
                    className="w-full bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm font-body focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-sm font-body">₹</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Amount"
                      value={budgetAmount}
                      onChange={e => setBudgetAmount(e.target.value)}
                      className="w-full bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2.5 text-slate-900 dark:text-white text-sm font-body focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-400 dark:placeholder-slate-600"
                    />
                  </div>
                </div>
              </div>
              <StepNav
                onSkip={advance}
                onNext={handleSaveBudget}
                nextLabel="Save & Next"
                loading={loading}
              />
            </StepSlide>
          )}

          {step === 4 && (
            <StepSlide key="s4" direction={1}>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">Create a group</h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-body text-sm">
                  Split expenses with friends, roommates, or colleagues.
                </p>
                <input
                  type="text"
                  placeholder="e.g. Roommates, Goa Trip, Office Lunches"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="w-full bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm font-body focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={finish}
                  disabled={loading}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-body transition-colors disabled:opacity-50"
                >
                  Skip & Finish
                </button>
                <PrimaryButton onClick={handleCreateGroup} loading={loading} icon={<ChevronRight className="w-4 h-4" />}>
                  Create & Finish
                </PrimaryButton>
              </div>
            </StepSlide>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function StepSlide({ children, direction }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction * 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction * -40 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

function StepNav({ onSkip, onNext, nextLabel = 'Next', nextDisabled = false, loading = false }) {
  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={onSkip}
        className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-body transition-colors"
      >
        Skip
      </button>
      <PrimaryButton onClick={onNext} disabled={nextDisabled} loading={loading} icon={<ChevronRight className="w-4 h-4" />}>
        {nextLabel}
      </PrimaryButton>
    </div>
  )
}

function PrimaryButton({ children, onClick, disabled = false, loading = false, icon }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.03 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold font-heading transition-all duration-200 ${
        disabled || loading
          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
      }`}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
        </svg>
      ) : icon}
      {children}
    </motion.button>
  )
}
