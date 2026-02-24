async function callClaude(action, params) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Server error')
  return data
}

export async function parseExpense(text) {
  return callClaude('parseExpense', { text })
}

export async function parseReceiptImage(base64Data, mediaType = 'image/jpeg') {
  return callClaude('parseReceipt', { base64Data, mediaType })
}

// ─── Expense chat ─────────────────────────────────────────────────────────────

function buildExpenseSummary(expenses) {
  if (!expenses || expenses.length === 0) return 'No expenses recorded yet.'

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const byCategory = {}
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
  }
  const topCats = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, amt]) => `  - ${cat}: ₹${amt.toLocaleString('en-IN')}`)
    .join('\n')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recent = expenses.filter(e => {
    const d = e.date instanceof Date ? e.date : new Date(e.date)
    return d >= thirtyDaysAgo
  })
  const recentTotal = recent.reduce((s, e) => s + e.amount, 0)

  return `Total all-time: ₹${total.toLocaleString('en-IN')} across ${expenses.length} transactions
Last 30 days: ₹${recentTotal.toLocaleString('en-IN')} (${recent.length} transactions)
Top spending categories (all-time):
${topCats}`
}

export async function askExpenses(chatMessages, expenses) {
  const summary = buildExpenseSummary(expenses)
  const today = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })
  const data = await callClaude('askExpenses', { chatMessages, summary, today })
  return data.text
}

// ─── Smart savings suggestions ────────────────────────────────────────────────

export async function generateSavingsSuggestions(expenses) {
  const summary = buildExpenseSummary(expenses)
  return callClaude('savingsSuggestions', { summary })
}
