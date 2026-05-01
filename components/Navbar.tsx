'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import Link from 'next/link'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              FixMyStreet
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {user?.role === 'resident' ? (
              <>
                <Link href="/" className="text-gray-700 hover:text-indigo-600 font-medium">
                  Map
                </Link>
                <Link href="/report" className="text-gray-700 hover:text-indigo-600 font-medium">
                  + Report
                </Link>
                <Link href="/my-reports" className="text-gray-700 hover:text-indigo-600 font-medium">
                  My Reports
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="text-gray-700 hover:text-indigo-600 font-medium">
                  Map
                </Link>
                {user?.role === 'pmc' && (
                  <>
                    <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 font-medium">
                      Dashboard
                    </Link>
                    <Link href="/officer" className="text-gray-700 hover:text-indigo-600 font-medium">
                      Officer
                    </Link>
                  </>
                )}
              </>
            )}

            <div className="pl-6 border-l border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-gray-700 font-medium">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 hover:text-indigo-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            {user?.role === 'resident' ? (
              <>
                <Link href="/" className="block py-2 text-gray-700 hover:text-indigo-600">
                  Map
                </Link>
                <Link href="/report" className="block py-2 text-gray-700 hover:text-indigo-600">
                  + Report
                </Link>
                <Link href="/my-reports" className="block py-2 text-gray-700 hover:text-indigo-600">
                  My Reports
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="block py-2 text-gray-700 hover:text-indigo-600">
                  Map
                </Link>
                {user?.role === 'pmc' && (
                  <>
                    <Link href="/dashboard" className="block py-2 text-gray-700 hover:text-indigo-600">
                      Dashboard
                    </Link>
                    <Link href="/officer" className="block py-2 text-gray-700 hover:text-indigo-600">
                      Officer
                    </Link>
                  </>
                )}
              </>
            )}
            <button
              onClick={handleLogout}
              className="w-full mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
