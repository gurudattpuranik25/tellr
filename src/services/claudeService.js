const CATEGORIES = [
  'Food & Dining', 'Groceries', 'Housing/Rent', 'Transport', 'Shopping',
  'Entertainment', 'Health', 'Utilities', 'Subscriptions', 'Education',
  'Travel', 'Personal Care', 'Gifts', 'Other',
]

function localDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function stripFences(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

// ─── Production: Vercel serverless function ───────────────────────────────────
async function callProd(action, params) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Server error')
  return data
}

// ─── Dev: Anthropic SDK directly — key stays in .env.local, never shipped ─────
// import.meta.env.DEV is replaced with `false` at build time by Vite,
// so this entire branch + the dynamic SDK import are tree-shaken in production.
async function callDev(action, params) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true,
  })
  const today = localDate()

  if (action === 'parseExpense') {
    const { text } = params
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: `You are an expense parser. Given a natural language expense description, extract:
- amount (number, required — the rupee amount spent, in INR)
- category (one of: ${CATEGORIES.join(', ')})
- vendor (merchant/store name, or "Unknown" if not mentioned)
- description (brief 3-5 word summary of what was purchased)
- date (ISO format YYYY-MM-DD, default to today ${today} if not specified)

If the input is NOT a recognizable expense — e.g. random gibberish, unrelated text, questions, or anything a human cannot interpret as a purchase or payment — respond ONLY with:
{"error": "not_an_expense"}

Otherwise respond ONLY in valid JSON format, no markdown, no explanation, no code blocks:
{"amount": 250, "category": "Food & Dining", "vendor": "Swiggy", "description": "Lunch via Swiggy", "date": "${today}"}`,
      messages: [{ role: 'user', content: text }],
    })
    const parsed = JSON.parse(stripFences(response.content[0].text.trim()))
    if (parsed.error === 'not_an_expense') throw new Error('not_an_expense')
    if (typeof parsed.amount !== 'number' || parsed.amount <= 0) throw new Error('Could not extract a valid amount')
    if (!CATEGORIES.includes(parsed.category)) parsed.category = 'Other'
    return {
      amount: Math.round(parsed.amount * 100) / 100,
      category: parsed.category,
      vendor: parsed.vendor || 'Unknown',
      description: parsed.description || text.slice(0, 40),
      date: parsed.date || today,
    }
  }

  if (action === 'parseReceipt') {
    const { base64Data, mediaType } = params
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: `You are a receipt scanner. Extract expense details from the receipt image.
Respond ONLY in valid JSON, no markdown, no explanation:
{"amount": 450, "category": "Food & Dining", "vendor": "Restaurant Name", "description": "Dinner receipt", "date": "${today}"}
Categories: ${CATEGORIES.join(', ')}
Default date to today (${today}) if not visible on receipt.`,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: 'Extract the expense details from this receipt.' },
        ],
      }],
    })
    const parsed = JSON.parse(stripFences(response.content[0].text.trim()))
    if (typeof parsed.amount !== 'number' || parsed.amount <= 0) throw new Error('Could not extract a valid amount from receipt')
    if (!CATEGORIES.includes(parsed.category)) parsed.category = 'Other'
    return {
      amount: Math.round(parsed.amount * 100) / 100,
      category: parsed.category,
      vendor: parsed.vendor || 'Unknown',
      description: parsed.description || 'Receipt scan',
      date: parsed.date || today,
    }
  }

  if (action === 'askExpenses') {
    const { chatMessages, summary, today: clientToday } = params
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: `You are a finance assistant for Tellr. Answer in 1-3 short sentences max. Be direct — state numbers, no preamble, no methodology. Use ₹. Today is ${clientToday}.

${summary}`,
      messages: chatMessages,
    })
    return { text: response.content[0].text }
  }

  if (action === 'savingsSuggestions') {
    const { summary } = params
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: `You are a personal finance advisor. Based on the spending data, give 3-4 specific, actionable savings tips.
Return ONLY a valid JSON array, no markdown, no explanation:
[{"tip":"Specific actionable advice in 1-2 sentences.","potential":"₹500-1000/month"},...]
If savings cannot be estimated, set "potential" to null.`,
      messages: [{ role: 'user', content: `Here is my expense data:\n${summary}\n\nGive me personalized savings suggestions.` }],
    })
    return JSON.parse(stripFences(response.content[0].text.trim()))
  }

  throw new Error('Unknown action')
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
function callClaude(action, params) {
  if (import.meta.env.DEV) return callDev(action, params)
  return callProd(action, params)
}

// ─── Public API ───────────────────────────────────────────────────────────────

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
