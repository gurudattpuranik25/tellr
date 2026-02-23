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

export async function parseExpense(text) {
  const today = new Date().toISOString().split('T')[0]

  const systemPrompt = `You are an expense parser. Given a natural language expense description, extract:
- amount (number, required — the rupee amount spent, in INR)
- category (one of: ${CATEGORIES.join(', ')})
- vendor (merchant/store name, or "Unknown" if not mentioned)
- description (brief 3-5 word summary of what was purchased)
- date (ISO format YYYY-MM-DD, default to today ${today} if not specified)

Respond ONLY in valid JSON format, no markdown, no explanation, no code blocks:
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
