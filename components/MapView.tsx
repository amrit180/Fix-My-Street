'use client'

import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/context/AuthContext'
import { Issue, IssueCategory, IssueStatus, ISSUE_COLORS } from '@/lib/types'
import { Loader } from '@googlemaps/js-api-loader'

const PATNA_CENTER = { lat: 25.5941, lng: 85.1376 }

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | 'all'>('all')
  const [mapReady, setMapReady] = useState(false)
  const { user } = useAuth()

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
      })

      const { Map: MapConstructor } = await loader.importLibrary('maps')

      if (mapRef.current && !googleMapRef.current) {
        googleMapRef.current = new MapConstructor(mapRef.current, {
          zoom: 13,
          center: PATNA_CENTER,
          mapTypeId: 'roadmap',
          fullscreenControl: false,
          zoomControl: true,
          mapTypeControl: false,
        })
        setMapReady(true)
      }
    }

    initMap()
  }, [])

  // Fetch issues from Firestore
  useEffect(() => {
    if (!user) return

    const issuesQuery = collection(db, 'issues')
    const unsubscribe = onSnapshot(issuesQuery, (snapshot) => {
      const newIssues: Issue[] = []
      snapshot.forEach((doc) => {
        newIssues.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        } as Issue)
      })
      setIssues(newIssues)
    })

    return () => unsubscribe()
  }, [user])

  // Filter issues
  useEffect(() => {
    let filtered = issues

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((issue) => issue.category === selectedCategory)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((issue) => issue.status === selectedStatus)
    }

    setFilteredIssues(filtered)
  }, [issues, selectedCategory, selectedStatus])

  // Update map markers (use google.maps.* — modular importLibrary('maps') may not expose constructors)
  useEffect(() => {
    const updateMarkers = () => {
      markersRef.current.forEach((marker: any) => marker.setMap(null))
      markersRef.current = []

      if (!mapReady || !googleMapRef.current) return

      const maps = (window as unknown as { google?: { maps?: any } }).google?.maps
      const MarkerCtor = maps?.Marker
      const InfoWindowCtor = maps?.InfoWindow
      const SymbolPath = maps?.SymbolPath
      if (!MarkerCtor || !InfoWindowCtor || !SymbolPath) return

      filteredIssues.forEach((issue) => {
        const marker = new MarkerCtor({
          position: { lat: issue.latitude, lng: issue.longitude },
          map: googleMapRef.current,
          title: issue.title,
          icon: {
            path: SymbolPath.CIRCLE,
            scale: 8,
            fillColor: ISSUE_COLORS[issue.status],
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        })

        const infoWindow = new InfoWindowCtor({
          content: `
            <div class="p-3 max-w-xs">
              <h3 class="font-bold text-gray-900">${issue.title}</h3>
              <p class="text-sm text-gray-600">${issue.category}</p>
              <p class="text-xs text-gray-500">ID: ${issue.uniqueId}</p>
              <p class="text-sm font-semibold mt-2">Status: ${issue.status}</p>
              <p class="text-sm text-gray-700">👍 ${issue.upvotes}</p>
            </div>
          `,
        })

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker)
        })

        markersRef.current.push(marker)
      })
    }

    updateMarkers()
  }, [filteredIssues, mapReady])

  const categoryOptions: { label: string; value: IssueCategory | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pothole', value: 'pothole' },
    { label: 'Streetlight', value: 'streetlight' },
    { label: 'Garbage', value: 'garbage' },
    { label: 'Waterlogging', value: 'waterlogging' },
    { label: 'Other', value: 'other' },
  ]

  const statusOptions: { label: string; value: IssueStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Reported', value: 'Reported' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Resolved', value: 'Resolved' },
  ]

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="bg-white border-b border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {categoryOptions.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                selectedCategory === cat.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                selectedStatus === status.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={mapRef}
        className="flex-1 w-full"
        style={{ minHeight: '400px' }}
      />

      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-bold text-gray-900 mb-3">
          Issues Found: {filteredIssues.length}
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredIssues.slice(0, 5).map((issue) => (
            <div key={issue.id} className="p-2 bg-gray-50 rounded border border-gray-200">
              <p className="font-semibold text-sm text-gray-900">{issue.uniqueId}</p>
              <p className="text-xs text-gray-600">{issue.title}</p>
              <p className="text-xs text-gray-500">👍 {issue.upvotes}</p>
            </div>
          ))}
          {filteredIssues.length > 5 && (
            <p className="text-xs text-gray-500 text-center">
              +{filteredIssues.length - 5} more issues
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
