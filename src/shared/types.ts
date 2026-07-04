import { Timestamp } from 'firebase/firestore'

// ─── User ─────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string
  login: string
  displayName: string
  createdAt: Timestamp
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export type Currency = 'UAH' | 'USD' | 'EUR'

// ─── Connection ───────────────────────────────────────────────────────────────

export type ConnectionMode = 'personal' | 'shared'
export type ConnectionStatus = 'active' | 'pending_invite'
export type ConnectionType =
  | 'couple'
  | 'friend'
  | 'parents'
  | 'relatives'
  | 'colleague'
  | 'neighbor'
  | 'other'

export interface Connection {
  id: string
  name: string
  type: ConnectionType
  mode: ConnectionMode
  currency: Currency
  memberIds: string[]
  virtualPartnerName: string | null
  inviteCode: string | null
  status: ConnectionStatus
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export type TransactionStatus = 'pending' | 'confirmed' | 'rejected'
export type TransactionMethod = 'cash' | 'card' | 'transfer' | 'other'
export type TransactionCategory =
  | 'food'
  | 'transport'
  | 'utilities'
  | 'entertainment'
  | 'health'
  | 'shopping'
  | 'other'

export interface Transaction {
  id: string
  connectionId: string
  amount: number
  currency: Currency
  description: string
  category: TransactionCategory
  method: TransactionMethod
  /** userId, or 'partner' in personal mode */
  payerId: string
  /** userId, or 'partner' in personal mode */
  beneficiaryId: string
  createdBy: string
  status: TransactionStatus
  confirmedBy: string | null
  confirmedAt: Timestamp | null
  transactionDate: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export interface BalanceResult {
  /** Absolute net balance amount */
  amount: number
  /** userId or 'partner' who owes money, null if settled */
  debtorId: string | null
  /** userId or 'partner' who is owed money, null if settled */
  creditorId: string | null
  /** True when net balance is exactly 0 */
  isSettled: boolean
  /** Raw net from currentUser's perspective: >0 means partner owes currentUser */
  net: number
}

// ─── Summary stats ────────────────────────────────────────────────────────────

export interface TransactionStats {
  confirmedCount: number
  pendingCount: number
  rejectedCount: number
  totalCount: number
  confirmedTotal: number
  pendingTotal: number
}
