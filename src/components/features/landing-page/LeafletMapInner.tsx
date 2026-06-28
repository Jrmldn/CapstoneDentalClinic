'use client'

import React, { useEffect, useRef, useMemo } from 'react'
import L from 'leaflet'
import { createRoot, Root } from 'react-dom/client'
import { ClinicCard } from '@/app/components/ClinicCard'
import { getEffectiveClinicStatus } from '@/lib/clinicStatus'

interface Clinic {
  id: number
  name: string
  address: string
  phone: string | null
  manual_status: string | null
  clinic_operating_hours: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean | null }[]
  clinic_gallery?: { image_url: string; sort_order: number | null }[]
  feedback: { rating: number }[]
  latitude: number | null
  longitude: number | null
}

interface LeafletMapInnerProps {
  clinics: Clinic[]
  onMapReady: () => void
  activeClinicId: number | null
  onMarkerClick: (id: number) => void
}

const LeafletMapInner = ({ clinics, onMapReady, activeClinicId, onMarkerClick }: LeafletMapInnerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<{ [key: number]: L.Marker }>({})
  const popupRootsRef = useRef<Map<number, Root>>(new Map())

  // Helper to safely unmount a React root asynchronously
  const safeUnmount = (root: Root) => {
    setTimeout(() => {
      try {
        root.unmount()
      } catch {
        // Ignore unmount errors
      }
    }, 0)
  }

  // Memoized custom dental icon
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
      popupAnchor: [0, -20]
    })
  }, [])

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const popupRoots = popupRootsRef.current

    try {
      // Create map instance
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        scrollWheelZoom: true
      }).setView([14.5995, 120.9842], 12)

      // Add tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        detectRetina: true,
      }).addTo(mapRef.current)

      // Add zoom control
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)

      // SIGNAL READINESS IMMEDIATELY - Ensures the loading screen goes away even if other things hang
      onMapReady()

      // Handle window resize to prevent white screen
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) mapRef.current.invalidateSize()
      })
      resizeObserver.observe(mapContainerRef.current)

      // Initial size correction after a short delay
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize()
      }, 250)

    } catch (error) {
      console.error("Leaflet init error:", error)
      onMapReady()
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      popupRoots.forEach(root => safeUnmount(root))
      popupRoots.clear()
    }
  }, [onMapReady])

  // Update Markers
  useEffect(() => {
    if (!mapRef.current || !dentalIcon) return

    // Clear old markers and roots
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}
    popupRootsRef.current.forEach(root => safeUnmount(root))
    popupRootsRef.current.clear()

    const bounds = L.latLngBounds([])
    let hasMarkers = false

    clinics.forEach((clinic) => {
      if (!clinic.latitude || !clinic.longitude) return
      hasMarkers = true

      const container = L.DomUtil.create('div', 'popup-card-wrapper')
      const root = createRoot(container)
      root.render(
        <ClinicCard 
          id={clinic.id}
          name={clinic.name}
          address={clinic.address}
          phone={clinic.phone}
          gallery={clinic.clinic_gallery}
          feedback={clinic.feedback}
          isOpen={getEffectiveClinicStatus(clinic.manual_status, clinic.clinic_operating_hours) === 'open'}
          operatingHours={clinic.clinic_operating_hours}
          compact={true}
          className="bg-transparent shadow-none"
        />
      )
      
      popupRootsRef.current.set(clinic.id, root)

      const marker = L.marker([clinic.latitude, clinic.longitude], { icon: dentalIcon })
        .addTo(mapRef.current!)
        .bindPopup(container, {
          maxWidth: 280,
          minWidth: 240,
          className: 'custom-clinic-popup',
          autoPan: true,
          autoPanPaddingTopLeft: L.point(20, 90),
          autoPanPaddingBottomRight: L.point(20, 20)
        })
        .on('click', function (this: L.Marker) { onMarkerClick(clinic.id); this.openPopup() })

      markersRef.current[clinic.id] = marker
      bounds.extend([clinic.latitude, clinic.longitude])
    })

    if (hasMarkers && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
    
    // Size correction after markers are added
    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize()
    }, 100)

  }, [clinics, dentalIcon, onMarkerClick])

  // Sidebar click: fly smoothly to the marker — popup is NOT opened here.
  // Popup only opens when the marker itself is clicked (handled in the click handler above).
  useEffect(() => {
    if (activeClinicId && markersRef.current[activeClinicId] && mapRef.current) {
      const marker = markersRef.current[activeClinicId]
      mapRef.current.flyTo(marker.getLatLng(), mapRef.current.getZoom(), {
        animate: true,
        duration: 0.6,
      })
    }
  }, [activeClinicId])

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full min-h-[400px] relative bg-slate-50" 
    />
  )
}

export default LeafletMapInner
