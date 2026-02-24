import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Housing/Rent',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Utilities',
  'Subscriptions',
  'Education',
  'Travel',
  'Personal Care',
  'Gifts',
  'Other',
]

function localDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function parseExpense(text) {
  const today = localDate()

  const systemPrompt = `You are an expense parser. Given a natural language expense description, extract:
- amount (number, required — the rupee amount spent, in INR)
- category (one of: ${CATEGORIES.join(', ')})
- vendor (merchant/store name, or "Unknown" if not mentioned)
- description (brief 3-5 word summary of what was purchased)
- date (ISO format YYYY-MM-DD, default to today ${today} if not specified)

If the input is NOT a recognizable expense — e.g. random gibberish, unrelated text, questions, or anything a human cannot interpret as a purchase or payment — respond ONLY with:
{"error": "not_an_expense"}

Otherwise respond ONLY in valid JSON format, no markdown, no explanation, no code blocks:
{"amount": 250, "category": "Food & Dining", "vendor": "Swiggy", "description": "Lunch via Swiggy", "date": "${today}"}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: 'user', content: text }],
  })

  const content = response.content[0].text.trim()

  // Strip any accidental markdown code fences
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const parsed = JSON.parse(cleaned)

  // Reject unrecognizable input
  if (parsed.error === 'not_an_expense') {
    throw new Error('not_an_expense')
  }

  // Validate required fields
  if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
    throw new Error('Could not extract a valid amount')
  }

  if (!CATEGORIES.includes(parsed.category)) {
    parsed.category = 'Other'
  }

  return {
    amount: Math.round(parsed.amount * 100) / 100,
    category: parsed.category,
    vendor: parsed.vendor || 'Unknown',
    description: parsed.description || text.slice(0, 40),
    date: parsed.date || today,
  }
}

// ─── Receipt scanning via Claude Vision ──────────────────────────────────────

export async function parseReceiptImage(base64Data, mediaType = 'image/jpeg') {
  const today = localDate()

  const systemPrompt = `You are a receipt scanner. Extract expense details from the receipt image.
Respond ONLY in valid JSON, no markdown, no explanation:
{"amount": 450, "category": "Food & Dining", "vendor": "Restaurant Name", "description": "Dinner receipt", "date": "${today}"}
Categories: ${CATEGORIES.join(', ')}
Default date to today (${today}) if not visible on receipt.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64Data },
        },
        { type: 'text', text: 'Extract the expense details from this receipt.' },
      ],
    }],
  })

  const content = response.content[0].text.trim()
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const parsed = JSON.parse(cleaned)

  if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
    throw new Error('Could not extract a valid amount from receipt')
  }

  if (!CATEGORIES.includes(parsed.category)) {
    parsed.category = 'Other'
  }

  return {
    amount: Math.round(parsed.amount * 100) / 100,
    category: parsed.category,
    vendor: parsed.vendor || 'Unknown',
    description: parsed.description || 'Receipt scan',
    date: parsed.date || today,
  }
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

  const systemPrompt = `You are a finance assistant for Tellr. Answer in 1-3 short sentences max. Be direct — state numbers, no preamble, no methodology. Use ₹. Today is ${today}.

${summary}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: chatMessages,
  })

  return response.content[0].text
}

// ─── Smart savings suggestions ────────────────────────────────────────────────

export async function generateSavingsSuggestions(expenses) {
  const summary = buildExpenseSummary(expenses)

  const systemPrompt = `You are a personal finance advisor. Based on the spending data, give 3-4 specific, actionable savings tips.
Return ONLY a valid JSON array, no markdown, no explanation:
[{"tip":"Specific actionable advice in 1-2 sentences.","potential":"₹500-1000/month"},...]
If savings cannot be estimated, set "potential" to null.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Here is my expense data:\n${summary}\n\nGive me personalized savings suggestions.`,
    }],
  })

  const content = response.content[0].text.trim()
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(cleaned)
}
