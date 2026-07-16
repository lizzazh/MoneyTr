import { useState, useEffect } from 'react'
import {
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
} from 'firebase/firestore'
import { connectionsCol, db } from '@/shared/firebase'
import type { Connection, Currency, AppUser, ConnectionType, ConnectionMode } from '@/shared/types'
import { assertOnline } from '@/shared/lib/offline'

// ─── Generate Invite Code ─────────────────────────────────────────────────────

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let part1 = ''
  let part2 = ''
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length))
    part2 += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${part1}-${part2}`
}

// ─── useConnections (List) ────────────────────────────────────────────────────

interface UseConnectionsReturn {
  connections: Connection[]
  isLoading: boolean
  error: string | null
}

export function useConnections(userId: string | undefined): UseConnectionsReturn {
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setConnections([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Query where memberIds contains current user's ID
    const q = query(connectionsCol, where('memberIds', 'array-contains', userId))

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Connection))
        
        // Local filtering for activeMemberIds
        list = list.filter(c => {
          if (c.activeMemberIds && Array.isArray(c.activeMemberIds)) {
            return c.activeMemberIds.includes(userId);
          }
          return true; // Legacy connections
        });

        // Sort active first, then newest
        list.sort((a, b) => {
          const aTime = a.createdAt?.toMillis() ?? 0
          const bTime = b.createdAt?.toMillis() ?? 0
          return bTime - aTime
        })
        setConnections(list)
        setIsLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useConnections error:', err)
        setError('Помилка завантаження зв\'язків')
        setIsLoading(false)
      }
    )

    return unsubscribe
  }, [userId])

  return { connections, isLoading, error }
}

// ─── useConnectionById ────────────────────────────────────────────────────────

interface UseConnectionByIdReturn {
  connection: Connection | null
  partner: AppUser | null
  isLoading: boolean
  error: string | null
}

export function useConnectionById(
  connectionId: string | undefined,
  currentUserId: string | undefined
): UseConnectionByIdReturn {
  const [connection, setConnection] = useState<Connection | null>(null)
  const [partner, setPartner] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!connectionId || !currentUserId) {
      setConnection(null)
      setPartner(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const unsubscribe = onSnapshot(
      doc(db, 'connections', connectionId),
      async (snap) => {
        try {
          if (!snap.exists()) {
            setConnection(null)
            setPartner(null)
            setIsLoading(false)
            return
          }

          const conn = { id: snap.id, ...snap.data() } as Connection

          // Security check: is current user an active member?
          if (conn.activeMemberIds && Array.isArray(conn.activeMemberIds)) {
            if (!conn.activeMemberIds.includes(currentUserId)) {
              setConnection(null)
              setPartner(null)
              setError('Немає доступу до цього зв\'язку')
              setIsLoading(false)
              return
            }
          }

          setConnection(conn)

          // Resolve partner user details if shared mode and second user exists
          const otherUserId = conn.memberIds.find((id) => id !== currentUserId)
          if (conn.mode === 'shared' && otherUserId) {
            const partnerSnap = await getDoc(doc(db, 'users', otherUserId))
            if (partnerSnap.exists()) {
              setPartner({ id: partnerSnap.id, ...partnerSnap.data() } as AppUser)
            } else {
              setPartner(null)
            }
          } else {
            setPartner(null)
          }

          setError(null)
        } catch (err) {
          console.error('useConnectionById error:', err)
          setError('Помилка завантаження деталей зв\'язку')
        } finally {
          setIsLoading(false)
        }
      },
      (err) => {
        console.error('useConnectionById snapshot error:', err)
        setError('Помилка завантаження деталей зв\'язку')
        setIsLoading(false)
      }
    )

    return unsubscribe
  }, [connectionId, currentUserId])

  return { connection, partner, isLoading, error }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export interface CreateConnectionInput {
  name: string
  type: ConnectionType
  mode: ConnectionMode
  currency: Currency
  creatorId: string
  virtualPartnerName?: string // only for personal mode
}

export async function createConnection(
  input: CreateConnectionInput
): Promise<string> {
  assertOnline()
  const isShared = input.mode === 'shared'
  const inviteCode = isShared ? generateInviteCode() : null
  const status = isShared ? 'pending_invite' : 'active'
  const now = serverTimestamp() as Timestamp

  const ref = await addDoc(connectionsCol, {
    name: input.name,
    type: input.type,
    mode: input.mode,
    currency: input.currency,
    memberIds: [input.creatorId],
    activeMemberIds: [input.creatorId],
    virtualPartnerName: !isShared ? (input.virtualPartnerName || 'Партнер') : null,
    inviteCode,
    status,
    createdBy: input.creatorId,
    createdAt: now,
    updatedAt: now,
  })

  return ref.id
}

export interface JoinConnectionResult {
  success: boolean
  error?: string
  connectionId?: string
}

export async function joinConnection(
  inviteCode: string,
  userId: string
): Promise<JoinConnectionResult> {
  assertOnline()
  
  // Clean up input: remove spaces, make uppercase
  let cleanCode = inviteCode.trim().toUpperCase().replace(/\s+/g, '')
  
  // Auto-insert hyphen if the user typed 8 chars without it
  if (cleanCode.length === 8 && !cleanCode.includes('-')) {
    cleanCode = `${cleanCode.slice(0, 4)}-${cleanCode.slice(4)}`
  }

  // Find connection with this inviteCode
  const q = query(
    connectionsCol,
    where('inviteCode', '==', cleanCode),
    where('status', '==', 'pending_invite')
  )

  let snap;
  try {
    snap = await getDocs(q)
  } catch (err: any) {
    console.error('Error finding connection by code:', err)
    return {
      success: false,
      error: 'Помилка бази даних під час пошуку коду.',
    }
  }

  if (snap.empty) {
    return {
      success: false,
      error: 'Недійсний або вже використаний код запрошення.',
    }
  }

  const connDoc = snap.docs[0]
  const connData = connDoc.data() as Connection

  // Check if current user is already the creator
  if (connData.memberIds.includes(userId)) {
    return {
      success: false,
      error: 'Ви є творцем цього зв\'язку.',
    }
  }

  // Update memberIds and set status to active
  const ref = doc(db, 'connections', connDoc.id)
  await updateDoc(ref, {
    memberIds: arrayUnion(userId),
    activeMemberIds: arrayUnion(userId),
    status: 'active' as Connection['status'],
    updatedAt: serverTimestamp(),
  })

  return {
    success: true,
    connectionId: connDoc.id,
  }
}

export async function updateConnection(
  connectionId: string,
  updates: Partial<Pick<Connection, 'name' | 'virtualPartnerName'>>
): Promise<void> {
  assertOnline()
  const ref = doc(db, 'connections', connectionId)
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteConnection(connectionId: string): Promise<void> {
  assertOnline()
  const ref = doc(db, 'connections', connectionId)
  await deleteDoc(ref)
}

export async function leaveConnection(connectionId: string, userId: string, currentActiveMembers: string[] | undefined): Promise<void> {
  assertOnline()
  const ref = doc(db, 'connections', connectionId)
  
  // If currentActiveMembers is undefined, it's a legacy connection, so active members are all memberIds
  let activeList = currentActiveMembers
  if (!activeList) {
    const snap = await getDoc(ref)
    const data = snap.data() as Connection
    activeList = data.memberIds || []
  }

  const newActive = activeList.filter(id => id !== userId)
  
  await updateDoc(ref, {
    activeMemberIds: newActive,
    status: 'partner_left',
    updatedAt: serverTimestamp(),
  })
}
