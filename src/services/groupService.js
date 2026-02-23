import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function createGroup(name, creator) {
  const member = {
    uid: creator.uid,
    displayName: creator.displayName || creator.email || 'Unknown',
    email: creator.email || '',
    photoURL: creator.photoURL || null,
  }
  const ref = await addDoc(collection(db, 'groups'), {
    name: name.trim(),
    createdBy: creator.uid,
    members: [member],
    memberUids: [creator.uid],
    createdAt: Timestamp.now(),
  })
  return ref.id
}

export function subscribeToUserGroups(uid, callback) {
  const q = query(
    collection(db, 'groups'),
    where('memberUids', 'array-contains', uid)
  )
  return onSnapshot(q, (snap) => {
    const groups = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() || new Date(),
    }))
    callback(groups)
  })
}

export function subscribeToGroup(groupId, callback) {
  return onSnapshot(doc(db, 'groups', groupId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data(), createdAt: snap.data().createdAt?.toDate() })
    }
  })
}

export async function addMemberToGroup(groupId, member) {
  const ref = doc(db, 'groups', groupId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  if (data.memberUids.includes(member.uid)) return

  await updateDoc(ref, {
    members: [
      ...data.members,
      {
        uid: member.uid,
        displayName: member.displayName || member.email || 'Unknown',
        email: member.email || '',
        photoURL: member.photoURL || null,
      },
    ],
    memberUids: [...data.memberUids, member.uid],
  })
}

export async function updateGroupName(groupId, name) {
  await updateDoc(doc(db, 'groups', groupId), { name: name.trim() })
}

export async function deleteGroup(groupId) {
  const batch = writeBatch(db)
  const expSnap = await getDocs(collection(db, 'groups', groupId, 'expenses'))
  expSnap.docs.forEach((d) => batch.delete(d.ref))
  const setSnap = await getDocs(collection(db, 'groups', groupId, 'settlements'))
  setSnap.docs.forEach((d) => batch.delete(d.ref))
  batch.delete(doc(db, 'groups', groupId))
  await batch.commit()
}

// ─── Group Expenses ────────────────────────────────────────────────────────────

export async function addGroupExpense(groupId, expense) {
  await addDoc(collection(db, 'groups', groupId, 'expenses'), {
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    paidBy: expense.paidBy,
    paidByName: expense.paidByName,
    splits: expense.splits, // [{ uid, name, amount }]
    date: expense.date,
    createdAt: Timestamp.now(),
  })
}

export async function deleteGroupExpense(groupId, expenseId) {
  await deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseId))
}

export function subscribeToGroupExpenses(groupId, callback) {
  const q = query(
    collection(db, 'groups', groupId, 'expenses'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

// ─── Settlements ──────────────────────────────────────────────────────────────

export async function addSettlement(groupId, settlement) {
  await addDoc(collection(db, 'groups', groupId, 'settlements'), {
    from: settlement.from,
    fromName: settlement.fromName,
    to: settlement.to,
    toName: settlement.toName,
    amount: settlement.amount,
    createdAt: Timestamp.now(),
  })
}

export function subscribeToGroupSettlements(groupId, callback) {
  const q = query(
    collection(db, 'groups', groupId, 'settlements'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}
