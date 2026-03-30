"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import {
  initEncryption,
  clearEncryption,
  isEncryptionReady as checkEncryptionReady,
  generateSalt,
  saltToBase64,
  base64ToSalt,
} from "@/lib/encryption"

interface AuthContextValue {
  user: FirebaseUser | null
  loading: boolean
  encryptionReady: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const EP_KEY = "_ep" // sessionStorage key for encryption password

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [encryptionReady, setEncryptionReady] = useState(false)

  async function setupEncryption(uid: string, password: string) {
    try {
      const settingsRef = doc(db, "user_settings", uid)
      const snap = await getDoc(settingsRef)
      let salt: Uint8Array
      if (snap.exists() && snap.data().encryptionSalt) {
        salt = base64ToSalt(snap.data().encryptionSalt)
      } else {
        salt = generateSalt()
        await setDoc(settingsRef, { encryptionSalt: saltToBase64(salt) }, { merge: true })
      }
      await initEncryption(password, salt)
      sessionStorage.setItem(EP_KEY, password)
      setEncryptionReady(true)
    } catch (err) {
      console.error("Encryption setup failed:", err)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const savedPw = sessionStorage.getItem(EP_KEY)
        if (savedPw) {
          await setupEncryption(firebaseUser.uid, savedPw)
        }
        setUser(firebaseUser)
      } else {
        clearEncryption()
        setEncryptionReady(false)
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
    const currentUser = auth.currentUser
    if (currentUser) await setupEncryption(currentUser.uid, password)
  }

  async function signUp(email: string, password: string) {
    await createUserWithEmailAndPassword(auth, email, password)
    const currentUser = auth.currentUser
    if (currentUser) await setupEncryption(currentUser.uid, password)
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    await signInWithPopup(auth, provider)
    // No encryption for Google sign-in — no password available
  }

  async function signOut() {
    clearEncryption()
    sessionStorage.removeItem(EP_KEY)
    setEncryptionReady(false)
    await firebaseSignOut(auth)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        encryptionReady,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
