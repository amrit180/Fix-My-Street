export interface Issue {
  id: string
  uniqueId: string
  title: string
  description: string
  category: IssueCategory
  latitude: number
  longitude: number
  photoUrl: string
  status: IssueStatus
  reporterId: string
  reporterName: string
  createdAt: Date
  updatedAt: Date
  upvotes: number
  upvoters: string[]
  ward: number
  resolutionNote?: string
}

export type IssueCategory = 'pothole' | 'streetlight' | 'garbage' | 'waterlogging' | 'other'

export type IssueStatus = 'Reported' | 'In Progress' | 'Resolved'

export const ISSUE_CATEGORIES: { label: string; value: IssueCategory }[] = [
  { label: 'Pothole', value: 'pothole' },
  { label: 'Streetlight', value: 'streetlight' },
  { label: 'Garbage', value: 'garbage' },
  { label: 'Waterlogging', value: 'waterlogging' },
  { label: 'Other', value: 'other' },
]

export const ISSUE_COLORS: Record<IssueStatus, string> = {
  'Reported': '#ef4444',
  'In Progress': '#f59e0b',
  'Resolved': '#10b981',
}

export type UserRole = 'resident' | 'pmc'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  ward?: number
  createdAt: Date
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  error: string | null
}
