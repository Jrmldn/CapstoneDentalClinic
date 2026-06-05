'use client'

import React, { useEffect, useRef, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  latitude: number | null
  longitude: number | null
  clinic_hmo: { hmo_name: string }[]
  clinic_specialties: { specialty_name: string }[]
  clinic_operating_hours: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }[]
  feedback: { rating: number }[]
}

interface LeafletMapInnerProps {
  clinics: Clinic[]
  onMapReady: (map: L.Map) => void
  activeClinicId: string | null
  onMarkerClick: (id: string) => void
}

/**
 * LeafletMapInner Refactor Summary:
 * - Extracted helper functions for rating, opening status, and popup content to improve readability.
 * - Used useMemo for custom dental icon to prevent redundant object creation.
 * - Standardized map initialization and marker synchronization logic.
 * - Added detailed comments for better maintainability.
 */

// Helper: Calculate average rating for a clinic
const getClinicRating = (feedback: Clinic['feedback']) => {
  if (!feedback || feedback.length === 0) return 'New'
  const total = feedback.reduce((sum, item) => sum + item.rating, 0)
  return (total / feedback.length).toFixed(1)
}

// Helper: Check if clinic is currently open
const checkIsClinicOpen = (hours: Clinic['clinic_operating_hours']) => {
  if (!hours || hours.length === 0) return false
  const now = new Date()
  const day = now.getDay()
  const curTime = now.getHours() * 100 + now.getMinutes()
  
  const today = hours.find(h => h.day_of_week === day)
  if (!today || today.is_closed) return false
  
  const [oh, om] = today.open_time.split(':').map(Number)
  const [ch, cm] = today.close_time.split(':').map(Number)
  return curTime >= (oh * 100 + om) && curTime <= (ch * 100 + cm)
}

// Helper: Generate HTML content for the map popup
const generatePopupHtml = (clinic: Clinic, rating: string, isOpen: boolean) => {
  return `
    <div class="p-1 w-64">
      <h4 class="font-bold text-gray-900 text-sm mb-2">${clinic.name}</h4>
      <div class="flex items-center gap-1 mb-3">
        <span class="text-amber-400">★</span>
        <span class="text-xs font-bold text-gray-700">${rating}</span>
        <span class="text-[10px] text-gray-400">(${clinic.feedback?.length || 0})</span>
        <span class="ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
          ${isOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
      <div class="space-y-2 text-[11px] text-gray-600 mb-4">
        <div class="flex items-start gap-2">
          <span class="text-blue-500 mt-0.5">📍</span>
          <span class="line-clamp-2">${clinic.address}</span>
        </div>
      </div>
      <a href="/login?clinic=${clinic.id}" class="popup-book-btn block w-full text-center py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
        Book Appointment
      </a>
    </div>
  `
}

const LeafletMapInner = ({ clinics, onMapReady, activeClinicId, onMarkerClick }: LeafletMapInnerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})

  // Memoized custom dental icon to avoid recreation on every render
  const dentalIcon = useMemo(() => {
    if (typeof window === 'undefined') return null
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-10 h-10 bg-blue-600/20 rounded-full animate-ping"></div>
          <div class="relative bg-white p-1.5 rounded-full shadow-lg border-2 border-blue-600 transform hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="rgba(37, 99, 235, 0.2)" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      className: 'custom-leaflet-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })
  }, [])

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || mapRef.current) return

    // Standard Leaflet Icon Fix for Next.js
    // @ts-expect-error - internal property
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    })

    const map = L.map(mapContainerRef.current, {
      center: [14.5995, 120.9842],
      zoom: 12,
      zoomControl: false,
      scrollWheelZoom: true,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map
    onMapReady(map)

    // Correction for container resize
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [onMapReady])

  // Synchronize Markers
  useEffect(() => {
    if (!mapRef.current || !dentalIcon) return

    // Cleanup existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}

    const bounds = L.latLngBounds([])
    let validMarkerCount = 0

    clinics.forEach(clinic => {
      if (clinic.latitude && clinic.longitude) {
        const rating = getClinicRating(clinic.feedback)
        const isOpen = checkIsClinicOpen(clinic.clinic_operating_hours)

        const marker = L.marker([clinic.latitude, clinic.longitude], { icon: dentalIcon })
          .addTo(mapRef.current!)
          .on('click', () => {
            onMarkerClick(clinic.id)
            marker.openPopup()
          })

        marker.bindPopup(generatePopupHtml(clinic, rating, isOpen), {
          closeButton: false,
          className: 'custom-clinic-popup'
        })

        markersRef.current[clinic.id] = marker
        bounds.extend([clinic.latitude, clinic.longitude])
        validMarkerCount++
      }
    })

    // Adjust view to fit all markers
    if (validMarkerCount > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [clinics, dentalIcon, onMarkerClick])

  // External Activation Control
  useEffect(() => {
    if (activeClinicId && markersRef.current[activeClinicId]) {
      const marker = markersRef.current[activeClinicId]
      marker.openPopup()
      
      // Smoothly pan to the selected clinic
      if (mapRef.current) {
        mapRef.current.flyTo(marker.getLatLng(), 15, {
          duration: 1.5,
          easeLinearity: 0.25
        })
      }
    }
  }, [activeClinicId])

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full min-h-[400px] z-0" 
      style={{ backgroundColor: '#f8fafc' }} 
    />
  )
}

export default LeafletMapInner
