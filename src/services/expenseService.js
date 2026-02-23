import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

function getExpensesRef(userId) {
  return collection(db, 'users', userId, 'expenses')
}

export async function addExpense(userId, expenseData) {
  const col = getExpensesRef(userId)
  const docRef = await addDoc(col, {
    text: expenseData.text || '',
    amount: expenseData.amount,
    category: expenseData.category,
    vendor: expenseData.vendor,
    description: expenseData.description,
    date: Timestamp.fromDate(new Date(expenseData.date + 'T12:00:00')),
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateExpense(userId, expenseId, updates) {
  const ref = doc(db, 'users', userId, 'expenses', expenseId)
  await updateDoc(ref, {
    amount: updates.amount,
    category: updates.category,
    vendor: updates.vendor,
    description: updates.description,
    date: Timestamp.fromDate(new Date(updates.date + 'T12:00:00')),
  })
}

export async function deleteExpense(userId, expenseId) {
  const ref = doc(db, 'users', userId, 'expenses', expenseId)
  await deleteDoc(ref)
}

export function subscribeToExpenses(userId, callback) {
  const col = getExpensesRef(userId)
  const q = query(col, orderBy('date', 'desc'))

  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        text: data.text || '',
        amount: data.amount,
        category: data.category,
        vendor: data.vendor,
        description: data.description,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      }
    })
    callback(expenses)
  })
}
