'use client'

import { Fragment, useEffect, useState } from 'react'
import { collection, onSnapshot, query, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/context/AuthContext'
import { Issue, IssueStatus, ISSUE_COLORS } from '@/lib/types'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

export default function OfficerPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all')
  const [completeForId, setCompleteForId] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'pmc') {
      router.push('/')
      return
    }

    const q = query(collection(db, 'issues'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next: Issue[] = []
      snapshot.forEach((d) => {
        const data = d.data()
        next.push({
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as Issue)
      })
      next.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setIssues(next)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, router])

  const setStatus = async (issueId: string, status: IssueStatus, note?: string) => {
    setSavingId(issueId)
    try {
      await updateDoc(doc(db, 'issues', issueId), {
        status,
        updatedAt: new Date(),
        resolutionNote: status === 'Resolved' ? (note ?? '').trim() : '',
      })
      setCompleteForId(null)
      setResolutionNote('')
    } finally {
      setSavingId(null)
    }
  }

  const filtered =
    filterStatus === 'all' ? issues : issues.filter((i) => i.status === filterStatus)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            <p className="mt-4 text-gray-600">Loading issues…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Officer — All issues</h1>
          <p className="text-gray-600 mt-2">
            Review every report and move work to <strong>In progress</strong> or mark it{' '}
            <strong>Completed</strong> (resolved).
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm font-semibold text-gray-700 mr-2">Status</span>
          {(['all', 'Reported', 'In Progress', 'Resolved'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filterStatus === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : s === 'Resolved' ? 'Completed' : s}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-500">{filtered.length} issue(s)</span>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reporter</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((issue) => (
                  <Fragment key={issue.id}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50/80">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{issue.uniqueId}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px] truncate" title={issue.title}>
                        {issue.title}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize text-gray-600">{issue.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{issue.reporterName || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-white text-xs font-semibold"
                          style={{ backgroundColor: ISSUE_COLORS[issue.status] }}
                        >
                          {issue.status === 'Resolved' ? 'Completed' : issue.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={issue.status === 'In Progress' || savingId === issue.id}
                            onClick={() => setStatus(issue.id, 'In Progress')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            In progress
                          </button>
                          {completeForId !== issue.id ? (
                            <button
                              type="button"
                              disabled={issue.status === 'Resolved' || savingId === issue.id}
                              onClick={() => {
                                setCompleteForId(issue.id)
                                setResolutionNote(issue.resolutionNote || '')
                              }}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Completed
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {completeForId === issue.id && (
                      <tr className="border-b border-gray-200 bg-emerald-50/40">
                        <td colSpan={6} className="px-4 py-4">
                          <p className="text-sm text-gray-700 mb-2">Optional note for residents:</p>
                          <textarea
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            rows={2}
                            maxLength={300}
                            className="w-full max-w-xl px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                            placeholder="What was done to fix this?"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={savingId === issue.id}
                              onClick={() => setStatus(issue.id, 'Resolved', resolutionNote)}
                              className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Confirm completed
                            </button>
                            <button
                              type="button"
                              disabled={savingId === issue.id}
                              onClick={() => {
                                setCompleteForId(null)
                                setResolutionNote('')
                              }}
                              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-12">No issues in this view.</p>
          )}
        </div>
      </div>
    </div>
  )
}
