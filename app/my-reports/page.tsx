'use client'

import { Suspense, useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/context/AuthContext'
import { Issue, ISSUE_COLORS } from '@/lib/types'
import Navbar from '@/components/Navbar'
import { useSearchParams } from 'next/navigation'

function MyReportsContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const msg = searchParams.get('success')
    if (msg) {
      setSuccess(msg)
      setTimeout(() => setSuccess(''), 3000)
    }
  }, [searchParams])

  useEffect(() => {
    if (!user || user.role !== 'resident') {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'issues'), where('reporterId', '==', user.id))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issues: Issue[] = []
      snapshot.forEach((doc) => {
        issues.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        } as Issue)
      })
      issues.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setIssues(issues)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const handleUpvote = async (issueId: string, isUpvoted: boolean) => {
    if (!user) return

    const issueRef = doc(db, 'issues', issueId)
    const issue = issues.find((i) => i.id === issueId)
    if (!issue) return

    let newUpvoters = [...(issue.upvoters || [])]
    if (isUpvoted) {
      newUpvoters = newUpvoters.filter((id) => id !== user.id)
    } else {
      newUpvoters.push(user.id)
    }

    await updateDoc(issueRef, {
      upvoters: newUpvoters,
      upvotes: newUpvoters.length,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading your reports...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reports</h1>
        <p className="text-gray-600 mb-8">Track all your submitted civic issues</p>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {issues.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No reports yet</p>
            <p className="text-gray-500">
              Click <span className="font-semibold">+ Report</span> to submit your first issue
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {issues.map((issue) => (
              <div key={issue.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="flex flex-col md:flex-row">
                  {issue.photoUrl && (
                    <img
                      src={issue.photoUrl}
                      alt={issue.title}
                      className="w-full md:w-48 h-48 object-cover"
                    />
                  )}

                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{issue.title}</h3>
                        <p className="text-sm text-gray-500">ID: {issue.uniqueId}</p>
                      </div>
                      <span
                        className="px-4 py-2 rounded-full text-white font-semibold text-sm"
                        style={{ backgroundColor: ISSUE_COLORS[issue.status] }}
                      >
                        {issue.status}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">{issue.description}</p>

                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Category:</span>
                        <span className="font-semibold text-gray-900 capitalize">{issue.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Submitted:</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {issue.status === 'Resolved' && issue.resolutionNote && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-green-900 mb-1">Resolution Note:</p>
                        <p className="text-green-800">{issue.resolutionNote}</p>
                      </div>
                    )}

                    <button
                      onClick={() => handleUpvote(issue.id, issue.upvoters?.includes(user?.id || '') || false)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        issue.upvoters?.includes(user?.id || '')
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      👍 {issue.upvotes}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MyReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
              <p className="mt-4 text-gray-600">Loading your reports...</p>
            </div>
          </div>
        </div>
      }
    >
      <MyReportsContent />
    </Suspense>
  )
}
