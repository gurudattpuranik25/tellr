import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'

function getBudgetsRef(userId) {
  return doc(db, 'users', userId, 'settings', 'budgets')
}

export function subscribeToBudgets(userId, callback) {
  const ref = getBudgetsRef(userId)
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data()?.budgets || {}) : {})
  })
}

export async function setBudget(userId, category, amount) {
  const ref = getBudgetsRef(userId)
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data()?.budgets || {}) : {}
  await setDoc(ref, { budgets: { ...current, [category]: amount } })
}

export async function removeBudget(userId, category) {
  const ref = getBudgetsRef(userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const budgets = { ...(snap.data()?.budgets || {}) }
  delete budgets[category]
  await setDoc(ref, { budgets })
}
