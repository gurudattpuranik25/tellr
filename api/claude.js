import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, ...params } = req.body
  const today = localDate()

  try {
    // ── Parse expense ────────────────────────────────────────────────────────
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

      if (parsed.error === 'not_an_expense') {
        return res.status(422).json({ error: 'not_an_expense' })
      }
      if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
        return res.status(422).json({ error: 'Could not extract a valid amount' })
      }
      if (!CATEGORIES.includes(parsed.category)) parsed.category = 'Other'

      return res.status(200).json({
        amount: Math.round(parsed.amount * 100) / 100,
        category: parsed.category,
        vendor: parsed.vendor || 'Unknown',
        description: parsed.description || text.slice(0, 40),
        date: parsed.date || today,
      })
    }

    // ── Parse receipt image ──────────────────────────────────────────────────
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

      if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
        return res.status(422).json({ error: 'Could not extract a valid amount from receipt' })
      }
      if (!CATEGORIES.includes(parsed.category)) parsed.category = 'Other'

      return res.status(200).json({
        amount: Math.round(parsed.amount * 100) / 100,
        category: parsed.category,
        vendor: parsed.vendor || 'Unknown',
        description: parsed.description || 'Receipt scan',
        date: parsed.date || today,
      })
    }

    // ── Expense chat ─────────────────────────────────────────────────────────
    if (action === 'askExpenses') {
      const { chatMessages, summary, today: clientToday } = params
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: `You are a finance assistant for Tellr. Answer in 1-3 short sentences max. Be direct — state numbers, no preamble, no methodology. Use ₹. Today is ${clientToday}.

${summary}`,
        messages: chatMessages,
      })
      return res.status(200).json({ text: response.content[0].text })
    }

    // ── Savings suggestions ──────────────────────────────────────────────────
    if (action === 'savingsSuggestions') {
      const { summary } = params
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: `You are a personal finance advisor. Based on the spending data, give 3-4 specific, actionable savings tips.
Return ONLY a valid JSON array, no markdown, no explanation:
[{"tip":"Specific actionable advice in 1-2 sentences.","potential":"₹500-1000/month"},...]
If savings cannot be estimated, set "potential" to null.`,
        messages: [{
          role: 'user',
          content: `Here is my expense data:\n${summary}\n\nGive me personalized savings suggestions.`,
        }],
      })
      return res.status(200).json(JSON.parse(stripFences(response.content[0].text.trim())))
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error(`[/api/claude] ${action} error:`, err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
