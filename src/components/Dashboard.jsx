import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'

import Navbar from './Navbar'
import MagicInput from './MagicInput'
import SummaryCards from './SummaryCards'
import ExpenseTable from './ExpenseTable'
import Charts from './Charts'
import MonthlyTrends from './MonthlyTrends'
import { useAuth } from '../hooks/useAuth'
import { useExpenses } from '../hooks/useExpenses'
import { useBudgets } from '../hooks/useBudgets'
import { parseExpense, parseReceiptImage } from '../services/claudeService'
import { addExpense, deleteExpense, updateExpense } from '../services/expenseService'
import BudgetProgress from './BudgetProgress'
import BudgetManager from './BudgetManager'
import SpendingNudges from './SpendingNudges'
import RecurringExpenses from './RecurringExpenses'
import { useRecurring } from '../hooks/useRecurring'
import AskAI from './AskAI'
import OnboardingModal from './OnboardingModal'
import { getOnboardingStatus, markOnboardingComplete } from '../services/userService'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function MonthSelector({ selectedMonth, selectedYear, onChange }) {
  const now = new Date()
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear()

  const prev = () => {
    if (selectedMonth === 0) onChange(11, selectedYear - 1)
    else onChange(selectedMonth - 1, selectedYear)
  }

  const next = () => {
    if (isCurrentMonth) return
    if (selectedMonth === 11) onChange(0, selectedYear + 1)
    else onChange(selectedMonth + 1, selectedYear)
  }

  return (
    <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-700/60 rounded-xl px-1 py-1">
      <button
        onClick={prev}
        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors duration-200"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1.5 px-3 min-w-[160px] justify-center">
        <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-sm font-medium font-heading text-slate-200 whitespace-nowrap">
          {MONTH_NAMES[selectedMonth]} {selectedYear}
        </span>
      </div>

      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { expenses, loading } = useExpenses(user?.uid)
  const { budgets } = useBudgets(user?.uid)
  const { recurringIds, recurringGroups } = useRecurring(expenses)
  const [budgetManagerOpen, setBudgetManagerOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!user || loading) return
    getOnboardingStatus(user.uid).then(completed => {
      if (completed) return
      if (expenses.length > 0) {
        markOnboardingComplete(user.uid)
        return
      }
      setShowOnboarding(true)
    })
  }, [user, loading, expenses])

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const handleMonthChange = (month, year) => {
    setSelectedMonth(month)
    setSelectedYear(year)
  }

  const handleAddExpense = async (text, date) => {
    try {
      const parsed = await parseExpense(text)
      await addExpense(user.uid, { ...parsed, date: date ?? parsed.date, text })
      toast.success(
        `Added ${parsed.description} — ₹${parsed.amount.toFixed(2)}`,
        { icon: '✨', duration: 3500 }
      )
    } catch (err) {
      console.error('Parse error:', err)
      if (err.message?.includes('JSON') || err.message?.includes('valid amount')) {
        toast.error("Couldn't understand that expense. Try being more specific.")
      } else if (err.message?.includes('API') || err.status === 401) {
        toast.error('API key error. Check your VITE_ANTHROPIC_API_KEY in .env')
      } else {
        toast.error("Couldn't parse that. Please try again.")
      }
    }
  }

  const handleScanReceipt = async (base64Data, mediaType) => {
    try {
      const parsed = await parseReceiptImage(base64Data, mediaType)
      await addExpense(user.uid, { ...parsed, text: `Receipt: ${parsed.description}` })
      toast.success(
        `Scanned ${parsed.description} — ₹${parsed.amount.toFixed(2)}`,
        { icon: '📷', duration: 3500 }
      )
    } catch (err) {
      console.error('Receipt scan error:', err)
      toast.error("Couldn't read that receipt. Try a clearer photo.")
    }
  }

  const handleUpdateExpense = async (expenseId, updates) => {
    try {
      await updateExpense(user.uid, expenseId, updates)
      toast.success('Expense updated')
    } catch {
      toast.error('Failed to update expense')
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    try {
      await deleteExpense(user.uid, expenseId)
      toast.success('Expense deleted')
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  // Monthly total for the header
  const monthTotal = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = e.date instanceof Date ? e.date : new Date(e.date)
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
      })
      .reduce((s, e) => s + e.amount, 0)
  }, [expenses, selectedMonth, selectedYear])

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/4 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Welcome + MagicInput */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white">
              {getGreeting()},{' '}
              <span className="gradient-text">
                {user?.displayName?.split(' ')[0] || 'there'}
              </span>
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-body">
              What did you spend on today?
            </p>
          </div>

          <MagicInput
            onSubmit={handleAddExpense}
            onScanReceipt={handleScanReceipt}
          />
        </motion.div>

        {/* Month selector + total */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <MonthSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onChange={handleMonthChange}
          />

          {monthTotal > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card px-4 py-2 flex items-center gap-2"
            >
              <span className="text-slate-400 text-sm font-body">
                {MONTH_NAMES[selectedMonth]} total:
              </span>
              <span className="text-white font-semibold font-heading">
                ₹{monthTotal.toFixed(2)}
              </span>
            </motion.div>
          )}
        </div>

        {/* Summary cards */}
        <SummaryCards
          expenses={expenses}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        {/* Spending nudges */}
        <SpendingNudges
          expenses={expenses}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        {/* Budget tracker */}
        <BudgetProgress
          expenses={expenses}
          budgets={budgets}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onManage={() => setBudgetManagerOpen(true)}
        />

        {/* Monthly trend */}
        <MonthlyTrends
          expenses={expenses}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        {/* Expense table */}
        <ExpenseTable
          expenses={expenses}
          onDelete={handleDeleteExpense}
          onUpdate={handleUpdateExpense}
          loading={loading}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          recurringIds={recurringIds}
        />

        {/* Recurring expenses */}
        <RecurringExpenses recurringGroups={recurringGroups} />

        {/* Charts */}
        <Charts
          expenses={expenses}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        {/* Budget manager modal */}
        <BudgetManager
          isOpen={budgetManagerOpen}
          onClose={() => setBudgetManagerOpen(false)}
          budgets={budgets}
          userId={user?.uid}
        />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center py-4"
        >
          <span className="text-slate-700 text-xs font-body flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Powered by Claude AI
          </span>
        </motion.div>
      </div>

      {/* Floating AI chat — rendered outside the padded container so it overlays correctly */}
      <AskAI expenses={expenses} />

      {/* First-login onboarding modal */}
      {showOnboarding && (
        <OnboardingModal
          user={user}
          onAddExpense={handleAddExpense}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
