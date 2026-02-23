import { useState, useEffect, useMemo } from 'react'
import {
  subscribeToGroup,
  subscribeToGroupExpenses,
  subscribeToGroupSettlements,
} from '../services/groupService'

/**
 * Computes net pairwise balances from expenses and settlements.
 * Returns an array of { from, fromName, to, toName, amount } where
 * 'from' owes 'to' the given amount.
 */
function computeBalances(expenses, settlements, members) {
  const memberMap = Object.fromEntries(members.map((m) => [m.uid, m.displayName || m.email]))

  // owed[debtor][creditor] = raw amount
  const owed = {}
  const ensure = (uid) => { if (!owed[uid]) owed[uid] = {} }

  for (const exp of expenses) {
    for (const split of exp.splits || []) {
      if (split.uid === exp.paidBy || split.amount <= 0) continue
      ensure(split.uid)
      owed[split.uid][exp.paidBy] = (owed[split.uid][exp.paidBy] || 0) + split.amount
    }
  }

  for (const s of settlements) {
    ensure(s.from)
    owed[s.from][s.to] = Math.max(0, (owed[s.from]?.[s.to] || 0) - s.amount)
  }

  const debts = []
  const seen = new Set()

  for (const from of Object.keys(owed)) {
    for (const to of Object.keys(owed[from])) {
      if (from === to) continue
      const key = [from, to].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)

      const aOwesB = owed[from]?.[to] || 0
      const bOwesA = owed[to]?.[from] || 0
      const net = Math.round((aOwesB - bOwesA) * 100) / 100

      if (Math.abs(net) < 0.01) continue

      const debtor = net > 0 ? from : to
      const creditor = net > 0 ? to : from
      debts.push({
        from: debtor,
        fromName: memberMap[debtor] || 'Unknown',
        to: creditor,
        toName: memberMap[creditor] || 'Unknown',
        amount: Math.abs(net),
      })
    }
  }

  return debts.sort((a, b) => b.amount - a.amount)
}

export function useGroupDetail(groupId) {
  const [group, setGroup] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId) return
    const unsubGroup = subscribeToGroup(groupId, (data) => {
      setGroup(data)
      setLoading(false)
    })
    const unsubExp = subscribeToGroupExpenses(groupId, setExpenses)
    const unsubSettle = subscribeToGroupSettlements(groupId, setSettlements)
    return () => { unsubGroup(); unsubExp(); unsubSettle() }
  }, [groupId])

  const balances = useMemo(
    () => computeBalances(expenses, settlements, group?.members || []),
    [expenses, settlements, group]
  )

  return { group, expenses, settlements, balances, loading }
}
