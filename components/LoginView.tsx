'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/context/AuthContext'

export default function LoginView() {
  const { signInWithGoogle, signInWithEmail, error } = useAuth()
  const [isEmail, setIsEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithEmail(email, password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FixMyStreet</h1>
          <p className="text-gray-600 mt-2">Report civic issues in Patna</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!isEmail ? (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition mb-4"
            >
              {loading ? 'Signing in...' : '🔍 Sign in with Google'}
            </button>

            <p className="text-center text-gray-600 text-sm mb-4">or</p>

            <button
              onClick={() => setIsEmail(true)}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Sign in as PMC Officer
            </button>

            <p className="text-center text-gray-500 text-xs mt-6">
              By signing in, you agree to our Terms of Service
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleEmailSignIn}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  placeholder="officer@pmc.gov.in"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition mb-4"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={() => {
                setIsEmail(false)
                setEmail('')
                setPassword('')
              }}
              className="w-full text-indigo-600 font-semibold py-2 rounded-lg hover:bg-indigo-50 transition"
            >
              Back to Google Sign In
            </button>
          </>
        )}
      </div>
    </div>
  )
}
