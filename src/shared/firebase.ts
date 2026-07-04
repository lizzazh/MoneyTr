import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore'
import type { AppUser, Connection, Transaction } from '@/shared/types'

// ─── Firebase Config ──────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// ─── Services ─────────────────────────────────────────────────────────────────

export const auth = getAuth(app)
export const db = getFirestore(app)

// ─── Typed Collection Refs ────────────────────────────────────────────────────

export const usersCol = collection(db, 'users') as CollectionReference<
  Omit<AppUser, 'id'>
>

export const connectionsCol = collection(db, 'connections') as CollectionReference<
  Omit<Connection, 'id'>
>

export function connectionDoc(
  connectionId: string
): DocumentReference<Omit<Connection, 'id'>> {
  return doc(db, 'connections', connectionId) as DocumentReference<Omit<Connection, 'id'>>
}

export function transactionsCol(
  connectionId: string
): CollectionReference<Omit<Transaction, 'id'>> {
  return collection(
    db,
    'connections',
    connectionId,
    'transactions'
  ) as CollectionReference<Omit<Transaction, 'id'>>
}

export function transactionDoc(
  connectionId: string,
  transactionId: string
): DocumentReference<Omit<Transaction, 'id'>> {
  return doc(
    db,
    'connections',
    connectionId,
    'transactions',
    transactionId
  ) as DocumentReference<Omit<Transaction, 'id'>>
}
