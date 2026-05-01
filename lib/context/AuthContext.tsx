'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User, AuthContextType, UserRole } from '@/lib/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              role: (userDoc.data().role || 'resident') as UserRole,
              ward: userDoc.data().ward,
              createdAt: new Date(userDoc.data().createdAt),
            })
          } else {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              role: 'resident',
              createdAt: new Date(),
            })
          }
        } else {
          setUser(null)
        }
      } catch (err) {
        setError('Failed to load user data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      setError(null)
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          role: 'resident',
          createdAt: new Date(),
        })
      }

      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        role: (userDoc.exists() ? userDoc.data().role || 'resident' : 'resident') as UserRole,
        ward: userDoc.exists() ? userDoc.data().ward : undefined,
        createdAt: new Date(),
      })
    } catch (err: any) {
      setError(err.message)
      console.error(err)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null)
      const result = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = result.user

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (userDoc.exists()) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userDoc.data().name || '',
          role: (userDoc.data().role || 'resident') as UserRole,
          ward: userDoc.data().ward,
          createdAt: new Date(userDoc.data().createdAt),
        })
      }
    } catch (err: any) {
      setError(err.message)
      console.error(err)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await signOut(auth)
      setUser(null)
    } catch (err: any) {
      setError(err.message)
      console.error(err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, logout, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
