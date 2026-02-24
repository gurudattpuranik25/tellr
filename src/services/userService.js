import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
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

export async function getOnboardingStatus(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data().onboardingCompleted === true : false
}

export async function markOnboardingComplete(uid) {
  await setDoc(doc(db, 'users', uid), { onboardingCompleted: true }, { merge: true })
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
