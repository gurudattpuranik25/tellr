import { useState, useEffect } from 'react'
import { subscribeToExpenses } from '../services/expenseService'

export function useExpenses(userId) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setExpenses([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToExpenses(userId, (data) => {
      setExpenses(data)
      setLoading(false)
    })

    return unsubscribe
  }, [userId])

  return { expenses, loading }
}
