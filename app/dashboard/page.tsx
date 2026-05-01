'use client'

import { useEffect, useState } from 'react'
import { collection, query, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/context/AuthContext'
import { Issue, IssueStatus, ISSUE_COLORS } from '@/lib/types'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'upvotes' | 'date'>('date')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'pmc') {
      router.push('/')
      return
    }

    const q = query(collection(db, 'issues'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issues: Issue[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        issues.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as Issue)
      })
      setIssues(issues)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, router])

  useEffect(() => {
    let filtered = issues.filter((issue) => issue.ward === user?.ward || issue.ward === 18)

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((issue) => issue.status === selectedStatus)
    }

    if (sortBy === 'upvotes') {
      filtered.sort((a, b) => b.upvotes - a.upvotes)
    } else {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }

    setFilteredIssues(filtered)
  }, [issues, selectedStatus, sortBy, user?.ward])

  const handleStatusUpdate = async (issueId: string, newStatus: IssueStatus) => {
    const issueRef = doc(db, 'issues', issueId)
    await updateDoc(issueRef, {
      status: newStatus,
      updatedAt: new Date(),
      resolutionNote: newStatus === 'Resolved' ? resolutionNote : '',
    })
    setEditingId(null)
    setResolutionNote('')
  }

  const statusCounts = {
    Reported: issues.filter((i) => i.status === 'Reported').length,
    'In Progress': issues.filter((i) => i.status === 'In Progress').length,
    Resolved: issues.filter((i) => i.status === 'Resolved').length,
  }

  const categoryCounts = issues.reduce(
    (acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">PMC Dashboard - Ward {user?.ward || 18}</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Issues</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{issues.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: ISSUE_COLORS['Reported'] }}>
            <p className="text-gray-600 text-sm font-semibold">Reported</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{statusCounts['Reported']}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: ISSUE_COLORS['In Progress'] }}>
            <p className="text-gray-600 text-sm font-semibold">In Progress</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{statusCounts['In Progress']}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: ISSUE_COLORS['Resolved'] }}>
            <p className="text-gray-600 text-sm font-semibold">Resolved</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{statusCounts['Resolved']}</p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Issues by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm capitalize">{category}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as IssueStatus | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
              >
                <option value="all">All</option>
                <option value="Reported">Reported</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'upvotes' | 'date')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
              >
                <option value="date">Date (Newest)</option>
                <option value="upvotes">Upvotes (Most)</option>
              </select>
            </div>
          </div>

          {/* Issues Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Upvotes</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{issue.uniqueId}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{issue.title}</td>
                    <td className="px-6 py-4 text-sm capitalize text-gray-700">{issue.category}</td>
                    <td className="px-6 py-4">
                      {editingId === issue.id ? (
                        <div className="space-y-2">
                          <select
                            value={issue.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as IssueStatus
                              handleStatusUpdate(issue.id, newStatus)
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600"
                          >
                            <option value="Reported">Reported</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                          {issue.status === 'Resolved' && (
                            <textarea
                              value={resolutionNote}
                              onChange={(e) => setResolutionNote(e.target.value)}
                              placeholder="Resolution note..."
                              maxLength={200}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                            />
                          )}
                        </div>
                      ) : (
                        <span
                          className="px-3 py-1 rounded-full text-white font-semibold text-xs"
                          style={{ backgroundColor: ISSUE_COLORS[issue.status] }}
                        >
                          {issue.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">👍 {issue.upvotes}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setEditingId(editingId === issue.id ? null : issue.id)}
                        className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm"
                      >
                        {editingId === issue.id ? 'Done' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredIssues.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No issues found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
