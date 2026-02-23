import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

export async function upsertUserProfile(user) {
  await setDoc(
    doc(db, 'users', user.uid),
    {
      displayName: user.displayName || '',
      email: user.email?.toLowerCase() || '',
      photoURL: user.photoURL || null,
    },
    { merge: true }
  )
}

export async function findUserByEmail(email) {
  const q = query(
    collection(db, 'users'),
    where('email', '==', email.toLowerCase().trim())
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { uid: d.id, ...d.data() }
}
