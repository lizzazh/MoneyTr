import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Currency, TransactionStatus, TransactionMethod, TransactionCategory, ConnectionType } from '@/shared/types'
import { Timestamp } from 'firebase/firestore'

// ─── cn helper ───────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ─── Currency formatting ──────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  UAH: '₴',
  USD: '$',
  EUR: '€',
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  const formatted = new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${formatted}\u00A0${symbol}`
}

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency]
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(timestamp: Timestamp | Date | null): string {
  if (!timestamp) return '—'
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateLong(timestamp: Timestamp | Date | null): string {
  if (!timestamp) return '—'
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(timestamp: Timestamp | Date | null): string {
  if (!timestamp) return '—'
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// ─── Transaction labels ───────────────────────────────────────────────────────

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Очікує підтвердження',
  confirmed: 'Підтверджено',
  rejected: 'Відхилено',
}

export const TRANSACTION_METHOD_LABELS: Record<TransactionMethod, string> = {
  cash: 'Готівка',
  card: 'Картка',
  transfer: 'Переказ',
  other: 'Інше',
}

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  food: '🍽 Їжа',
  transport: '🚗 Транспорт',
  utilities: '🏠 Комунальні',
  entertainment: '🎭 Розваги',
  health: '💊 Здоров\'я',
  shopping: '🛍 Покупки',
  other: '📦 Інше',
}

export const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  couple: '❤️ Чоловік / Дружина',
  friend: '👭 Друг / Подруга',
  parents: '👩‍👦 Батьки',
  relatives: '👨‍👩‍👧 Родина',
  colleague: '💼 Колега',
  neighbor: '🏠 Сусід',
  other: '📦 Інше',
}

