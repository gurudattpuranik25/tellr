import { useState, useEffect } from 'react'
import { subscribeToBudgets } from '../services/budgetService'

export function useBudgets(userId) {
  const [budgets, setBudgets] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    const unsub = subscribeToBudgets(userId, (data) => {
      setBudgets(data)
      setLoading(false)
    })
    return unsub
  }, [userId])

  return { budgets, loading }
}
