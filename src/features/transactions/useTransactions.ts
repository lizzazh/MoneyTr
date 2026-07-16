import { useState, useEffect } from 'react'
import {
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { transactionsCol, transactionDoc, activitiesCol } from '@/shared/firebase'
import type {
  Transaction,
  TransactionCategory,
  TransactionMethod,
  TransactionStatus,
  Currency,
  ActivityAction,
  ActivityLogEntry,
} from '@/shared/types'
import { assertOnline } from '@/shared/lib/offline'

// ─── useTransactions ──────────────────────────────────────────────────────────

interface UseTransactionsReturn {
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
}

export function useTransactions(connectionId: string | null): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!connectionId) {
      setTransactions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const col = transactionsCol(connectionId)
    const q = query(col, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => {
          const data = d.data()
          return { ...data, id: d.id, connectionId } as Transaction
        })
        setTransactions(docs)
        setIsLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useTransactions error:', err)
        setError('Помилка завантаження операцій')
        setIsLoading(false)
      }
    )

    return unsubscribe
  }, [connectionId])

  return { transactions, isLoading, error }
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export function useTransactionActivities(connectionId: string, transactionId: string | null) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!connectionId || !transactionId) {
      setActivities([])
      return
    }

    setIsLoading(true)
    const col = activitiesCol(connectionId)
    // We can't do a compound query on transactionId AND orderBy createdAt easily without an index.
    // Since it's MVP, we can just fetch all for the transaction. Wait, querying by transactionId is fine.
    // If we get an index error for orderBy, we can just sort in memory.
    const q = query(col, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ ...d.data(), id: d.id } as ActivityLogEntry))
          .filter(a => a.transactionId === transactionId)
        setActivities(docs)
        setIsLoading(false)
      },
      (err) => {
        console.error('useTransactionActivities error:', err)
        setIsLoading(false)
      }
    )

    return unsubscribe
  }, [connectionId, transactionId])

  return { activities, isLoading }
}

export async function logActivity(
  connectionId: string,
  transactionId: string,
  action: ActivityAction,
  userId: string,
  diff?: import('@/shared/types').TransactionDiff[]
): Promise<void> {
  assertOnline()
  const col = activitiesCol(connectionId)
  await addDoc(col, {
    connectionId,
    transactionId,
    action,
    userId,
    createdAt: serverTimestamp(),
    ...(diff && { diff }),
  })
}


// ─── Add transaction ──────────────────────────────────────────────────────────

export interface AddTransactionInput {
  connectionId: string
  amount: number
  currency: Currency
  description: string
  category: TransactionCategory
  method: TransactionMethod
  payerId: string
  beneficiaryId: string
  createdBy: string
  transactionDate: Date
  /** If personal mode, transaction is pre-confirmed */
  isPersonal: boolean
}

export function validateTransaction(input: AddTransactionInput): string | null {
  if (input.amount <= 0) return 'Сума має бути більше 0'
  if (input.payerId === input.beneficiaryId)
    return 'Платник і отримувач не можуть бути однією особою'
  return null
}

export async function addTransaction(
  input: AddTransactionInput
): Promise<void> {
  assertOnline()
  const validationError = validateTransaction(input)
  if (validationError) throw new Error(validationError)

  const col = transactionsCol(input.connectionId)
  const now = serverTimestamp() as Timestamp

  const status: TransactionStatus = input.isPersonal ? 'confirmed' : 'pending'
  const confirmedBy = input.isPersonal ? input.createdBy : null
  const confirmedAt = input.isPersonal ? now : null

  const docRef = await addDoc(col, {
    connectionId: input.connectionId,
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    category: input.category,
    method: input.method,
    payerId: input.payerId,
    beneficiaryId: input.beneficiaryId,
    createdBy: input.createdBy,
    status,
    confirmedBy,
    confirmedAt,
    transactionDate: Timestamp.fromDate(input.transactionDate),
    createdAt: now,
    updatedAt: now,
  })

  await logActivity(input.connectionId, docRef.id, 'created', input.createdBy)
  if (input.isPersonal) {
    await logActivity(input.connectionId, docRef.id, 'confirmed', input.createdBy)
  }
}

// ─── Update transaction ───────────────────────────────────────────────────────

export interface UpdateTransactionInput {
  connectionId: string
  transactionId: string
  updates: Partial<Omit<Transaction, 'id' | 'connectionId' | 'createdAt'>>
  currentTx: Transaction
  updatedBy: string
  isPersonal: boolean
}

const MEANINGFUL_FIELDS: (keyof Transaction)[] = [
  'amount',
  'currency',
  'description',
  'category',
  'method',
  'payerId',
  'beneficiaryId',
  'transactionDate',
]

export async function updateTransaction(input: UpdateTransactionInput): Promise<void> {
  assertOnline()
  const { connectionId, transactionId, updates, currentTx, updatedBy, isPersonal } = input

  // Generate diff
  const diff: import('@/shared/types').TransactionDiff[] = []
  const finalUpdates: any = { ...updates, updatedAt: serverTimestamp(), updatedBy }

  for (const [key, newValue] of Object.entries(updates)) {
    const k = key as keyof Transaction
    const oldValue = currentTx[k]
    
    // Simple equality check (for dates we need special handling)
    let isDifferent = false
    let oldValToLog: any = oldValue
    let newValToLog: any = newValue

    if (k === 'transactionDate') {
      const oldTime = (oldValue as Timestamp).toMillis()
      const newTime = (newValue as Timestamp).toMillis()
      if (oldTime !== newTime) {
        isDifferent = true
        oldValToLog = (oldValue as Timestamp).toDate().toISOString()
        newValToLog = (newValue as Timestamp).toDate().toISOString()
        finalUpdates[k] = newValue
      } else {
        delete finalUpdates[k] // Prevent unnecessary writes
      }
    } else if (oldValue !== newValue) {
      isDifferent = true
    }

    if (isDifferent) {
      diff.push({
        field: k,
        oldValue: oldValToLog ?? null,
        newValue: newValToLog ?? null,
      })
    }
  }

  if (diff.length === 0) return // No real changes

  const hasMeaningfulChanges = diff.some((d) => MEANINGFUL_FIELDS.includes(d.field))

  if (hasMeaningfulChanges && !isPersonal && (currentTx.status === 'confirmed' || currentTx.status === 'rejected')) {
    finalUpdates.status = 'pending'
    finalUpdates.confirmedBy = null
    finalUpdates.confirmedAt = null
  }

  const ref = transactionDoc(connectionId, transactionId)
  await updateDoc(ref, finalUpdates)
  await logActivity(connectionId, transactionId, 'updated', updatedBy, diff)
}

// ─── Confirm / Reject ─────────────────────────────────────────────────────────

export async function confirmTransaction(
  connectionId: string,
  transactionId: string,
  confirmedBy: string
): Promise<void> {
  assertOnline()
  const ref = transactionDoc(connectionId, transactionId)
  await updateDoc(ref, {
    status: 'confirmed' as TransactionStatus,
    confirmedBy,
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await logActivity(connectionId, transactionId, 'confirmed', confirmedBy)
}

export async function rejectTransaction(
  connectionId: string,
  transactionId: string,
  rejectedBy: string
): Promise<void> {
  assertOnline()
  const ref = transactionDoc(connectionId, transactionId)
  await updateDoc(ref, {
    status: 'rejected' as TransactionStatus,
    confirmedBy: null,
    confirmedAt: null,
    updatedAt: serverTimestamp(),
  })
  await logActivity(connectionId, transactionId, 'rejected', rejectedBy)
}

// ─── Soft Delete / Restore ─────────────────────────────────────────────────────

export async function softDeleteTransaction(
  connectionId: string,
  transactionId: string,
  deletedBy: string
): Promise<void> {
  assertOnline()
  const ref = transactionDoc(connectionId, transactionId)
  await updateDoc(ref, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy,
    updatedAt: serverTimestamp(),
  })
  await logActivity(connectionId, transactionId, 'deleted', deletedBy)
}

export async function restoreTransaction(
  connectionId: string,
  transactionId: string,
  restoredBy: string
): Promise<void> {
  assertOnline()
  const ref = transactionDoc(connectionId, transactionId)
  await updateDoc(ref, {
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    updatedAt: serverTimestamp(),
  })
  await logActivity(connectionId, transactionId, 'restored', restoredBy)
}


// ─── Filter hook ──────────────────────────────────────────────────────────────

export type FilterStatus = 'all' | TransactionStatus | 'deleted'

export function useTransactionFilter(_transactions: Transaction[]) {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [sortDesc, setSortDesc] = useState(true)
  return { filter, setFilter, sortDesc, setSortDesc }
}
