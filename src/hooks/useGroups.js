import { useState, useEffect } from 'react'
import { subscribeToUserGroups } from '../services/groupService'

export function useGroups(uid) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    const unsub = subscribeToUserGroups(uid, (data) => {
      setGroups(data)
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { groups, loading }
}
