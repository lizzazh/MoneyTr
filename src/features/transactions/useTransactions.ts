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
import { transactionsCol, transactionDoc } from '@/shared/firebase'
import type {
  Transaction,
  TransactionCategory,
  TransactionMethod,
  TransactionStatus,
  Currency,
} from '@/shared/types'

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
  const validationError = validateTransaction(input)
  if (validationError) throw new Error(validationError)

  const col = transactionsCol(input.connectionId)
  const now = serverTimestamp() as Timestamp

  const status: TransactionStatus = input.isPersonal ? 'confirmed' : 'pending'
  const confirmedBy = input.isPersonal ? input.createdBy : null
  const confirmedAt = input.isPersonal ? now : null

  await addDoc(col, {
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
}

// ─── Confirm / Reject ─────────────────────────────────────────────────────────

export async function confirmTransaction(
  connectionId: string,
  transactionId: string,
  confirmedBy: string
): Promise<void> {
  const ref = transactionDoc(connectionId, transactionId)
  await updateDoc(ref, {
    status: 'confirmed' as TransactionStatus,
    confirmedBy,
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function rejectTransaction(
  connectionId: string,
  transactionId: string
): Promise<void> {
  const ref = transactionDoc(connectionId, transactionId)
  await updateDoc(ref, {
    status: 'rejected' as TransactionStatus,
    confirmedBy: null,
    confirmedAt: null,
    updatedAt: serverTimestamp(),
  })
}

// ─── Filter hook ──────────────────────────────────────────────────────────────

type FilterStatus = 'all' | TransactionStatus

export function useTransactionFilter(_transactions: Transaction[]) {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [sortDesc, setSortDesc] = useState(true)
  return { filter, setFilter, sortDesc, setSortDesc }
}
