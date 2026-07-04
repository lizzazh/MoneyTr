import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { auth, db, usersCol } from '@/shared/firebase'
import type { AppUser } from '@/shared/types'

// ─── Context types ────────────────────────────────────────────────────────────

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  appUser: AppUser | null
  isLoading: boolean
  signIn: (login: string, password: string) => Promise<void>
  signUp: (
    login: string,
    password: string,
    displayName: string
  ) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAppUser = useCallback(async (uid: string): Promise<AppUser | null> => {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as AppUser
  }, [])

  const refreshUser = useCallback(async () => {
    if (!firebaseUser) return
    const user = await fetchAppUser(firebaseUser.uid)
    setAppUser(user)
  }, [firebaseUser, fetchAppUser])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)
      if (fbUser) {
        const user = await fetchAppUser(fbUser.uid)
        setAppUser(user)
      } else {
        setAppUser(null)
      }
      setIsLoading(false)
    })
    return unsubscribe
  }, [fetchAppUser])

  const signIn = useCallback(async (login: string, password: string) => {
    const cleanLogin = login.trim().toLowerCase()
    const email = `${cleanLogin}@debttrack.local`
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signUp = useCallback(
    async (
      login: string,
      password: string,
      displayName: string
    ) => {
      const cleanLogin = login.trim().toLowerCase()
      
      // Enforce login format (only letters, numbers, underscores)
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanLogin)) {
        throw new Error('invalid-login-format')
      }

      // Check login uniqueness in Firestore
      const q = query(usersCol, where('login', '==', cleanLogin))
      const snap = await getDocs(q)
      if (!snap.empty) {
        throw new Error('login-already-in-use')
      }

      const email = `${cleanLogin}@debttrack.local`
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      await updateProfile(credential.user, { displayName })

      const userDoc: Omit<AppUser, 'id'> = {
        login: cleanLogin,
        displayName,
        createdAt: serverTimestamp() as AppUser['createdAt'],
      }

      await setDoc(doc(db, 'users', credential.user.uid), userDoc)
    },
    []
  )

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  return (
    <AuthContext.Provider
      value={{ firebaseUser, appUser, isLoading, signIn, signUp, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
