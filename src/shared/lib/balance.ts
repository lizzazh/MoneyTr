import type { Transaction, BalanceResult, TransactionStats } from '@/shared/types'
import { Timestamp } from 'firebase/firestore'

/**
 * Calculates the net mutual balance between two users (or currentUser and virtual partner).
 *
 * Direction:
 *   payerId=A, beneficiaryId=B → B owes A (positive from A's perspective)
 *   payerId=B, beneficiaryId=A → A owes B (negative from A's perspective)
 *
 * Only CONFIRMED transactions are included.
 *
 * @param transactions - All transactions for this connection
 * @param currentUserId - The ID of the logged in user
 * @param partnerId - The ID of the partner (or 'partner' constant for personal mode)
 */
export function calcBalance(
  transactions: Transaction[],
  currentUserId: string,
  partnerId: string
): BalanceResult {
  const validTransactions = transactions.filter((t) => !t.isDeleted)
  const confirmed = validTransactions.filter((t) => t.status === 'confirmed')

  // Partner paid for currentUser → currentUser owes partner
  const iOwePartner = confirmed
    .filter(
      (t) => t.payerId === partnerId && t.beneficiaryId === currentUserId
    )
    .reduce((sum, t) => sum + t.amount, 0)

  // CurrentUser paid for partner → partner owes currentUser
  const partnerOwesMe = confirmed
    .filter(
      (t) => t.payerId === currentUserId && t.beneficiaryId === partnerId
    )
    .reduce((sum, t) => sum + t.amount, 0)

  // net > 0: partner owes currentUser
  // net < 0: currentUser owes partner
  const net = partnerOwesMe - iOwePartner

  if (net === 0) {
    return {
      amount: 0,
      debtorId: null,
      creditorId: null,
      isSettled: true,
      net: 0,
    }
  }

  return {
    amount: Math.abs(net),
    debtorId: net > 0 ? partnerId : currentUserId,
    creditorId: net > 0 ? currentUserId : partnerId,
    isSettled: false,
    net,
  }
}

/**
 * Calculates aggregate statistics for a list of transactions.
 */
export function calcStats(transactions: Transaction[]): TransactionStats {
  const validTransactions = transactions.filter((t) => !t.isDeleted)
  const confirmed = validTransactions.filter((t) => t.status === 'confirmed')
  const pending = validTransactions.filter((t) => t.status === 'pending')
  const rejected = validTransactions.filter((t) => t.status === 'rejected')

  let lastActivity: Timestamp | null = null
  if (validTransactions.length > 0) {
    lastActivity = validTransactions.reduce((latest, current) => {
      if (!latest) return current.updatedAt
      return current.updatedAt.toMillis() > latest.toMillis() ? current.updatedAt : latest
    }, null as Timestamp | null)
  }

  return {
    confirmedCount: confirmed.length,
    pendingCount: pending.length,
    rejectedCount: rejected.length,
    totalCount: validTransactions.length,
    confirmedTotal: confirmed.reduce((sum, t) => sum + t.amount, 0),
    pendingTotal: pending.reduce((sum, t) => sum + t.amount, 0),
    lastActivity,
  }
}
