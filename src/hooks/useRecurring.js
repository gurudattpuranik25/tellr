import { useMemo } from 'react'

function normalizeKey(expense) {
  if (expense.vendor && expense.vendor !== 'Unknown') {
    return expense.vendor.toLowerCase().trim()
  }
  return (expense.description || '').toLowerCase().trim().split(/\s+/).slice(0, 2).join(' ')
}

/**
 * Detects recurring expenses by grouping on (category + normalized vendor/description).
 * A group is considered recurring if it appears in 2+ distinct months AND
 * the amounts are consistent (coefficient of variation < 50%).
 *
 * Returns:
 *   recurringIds  — Set of expense IDs that belong to a recurring pattern
 *   recurringGroups — Array of { name, category, avgAmount, monthCount } sorted by avgAmount desc
 */
export function useRecurring(expenses) {
  return useMemo(() => {
    const groups = {}

    for (const e of expenses) {
      const key = `${e.category}::${normalizeKey(e)}`
      const d = e.date instanceof Date ? e.date : new Date(e.date)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`

      if (!groups[key]) {
        groups[key] = {
          displayName: normalizeKey(e),
          category: e.category,
          months: {},
          allAmounts: [],
        }
      }
      if (!groups[key].months[monthKey]) groups[key].months[monthKey] = []
      groups[key].months[monthKey].push(e)
      groups[key].allAmounts.push(e.amount)
    }

    const recurringIds = new Set()
    const recurringGroups = []

    for (const group of Object.values(groups)) {
      const monthKeys = Object.keys(group.months).sort()
      if (monthKeys.length < 2) continue

      const mean = group.allAmounts.reduce((s, v) => s + v, 0) / group.allAmounts.length
      if (mean < 10) continue // ignore trivial amounts

      // Reject if amounts vary too wildly (coefficient of variation > 50%)
      const variance = group.allAmounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / group.allAmounts.length
      const cv = Math.sqrt(variance) / mean
      if (cv > 0.5) continue

      for (const entries of Object.values(group.months)) {
        for (const e of entries) recurringIds.add(e.id)
      }

      recurringGroups.push({
        name: group.displayName,
        category: group.category,
        avgAmount: Math.round(mean * 100) / 100,
        monthCount: monthKeys.length,
      })
    }

    recurringGroups.sort((a, b) => b.avgAmount - a.avgAmount)

    return { recurringIds, recurringGroups }
  }, [expenses])
}
