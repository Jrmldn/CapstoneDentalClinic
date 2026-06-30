'use client'

import React, { useRef, useEffect, useState } from 'react'
import { MapPin, Navigation } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import { getEffectiveClinicStatus } from '@/lib/clinicStatus'
import { ClinicCard } from '@/app/components/ClinicCard'
import { ClinicMapProps } from './types'
import { useClinicFilters } from './useClinicFilters'
import { FilterSection } from './FilterSection'

// Dynamically import LeafletMapInner without the loading prop to avoid Next.js dynamic loader hangs
const LeafletMapInner = dynamic(
  () => import('./LeafletMapInner'),
  { ssr: false }
)

/**
 * ClinicMap Component
 * Refactored to act as a pure Presentational UI shell.
 * Business logic, state management, and side-effects are delegated to the useClinicFilters hook.
 * The filtering UI is delegated to the FilterSection component.
 */
export const ClinicMap = ({ clinics, bookingHref }: ClinicMapProps) => {
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const {
    showOpenOnly,
    setShowOpenOnly,
    minRating,
    setMinRating,
    activeClinicId,
    setActiveClinicId,
    isMapReady,
    filteredClinics,
    handleMapReady,
  } = useClinicFilters({ clinics })

  // Refs for sidebar scroll-into-view behaviour
  const sidebarRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<{ [id: number]: HTMLDivElement | null }>({})

  // When a map marker is clicked the activeClinicId changes — scroll the sidebar to that card
  useEffect(() => {
    if (activeClinicId && cardRefs.current[activeClinicId]) {
      cardRefs.current[activeClinicId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeClinicId])

  return (
    <div className="space-y-6">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <FilterSection
        minRating={minRating}
        setMinRating={setMinRating}
        showOpenOnly={showOpenOnly}
        setShowOpenOnly={setShowOpenOnly}
      />

      <div className="grid lg:grid-cols-3 gap-6 h-auto lg:h-[650px]">
        {/* Main Map Container */}
        <div className={cn(
          "lg:col-span-2 rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-slate-50 relative min-h-[350px] sm:min-h-[400px] h-[450px] lg:h-auto",
          mobileView === 'map' ? 'block' : 'hidden lg:block'
        )}>
          {/* Manual Loading UI controlled by state, not dynamic loader */}
          {!isMapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium text-sm">Initializing Map...</p>
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-3 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-900 text-sm">Interactive Map</span>
              </div>
              <Badge className="bg-blue-600 text-white border-none shadow-sm">
                {filteredClinics.length} Clinics Found
              </Badge>
            </div>
          </div>

          <LeafletMapInner
            key="leaflet-map-instance"
            clinics={filteredClinics}
            onMapReady={handleMapReady}
            activeClinicId={activeClinicId}
            onMarkerClick={setActiveClinicId}
            bookingHref={bookingHref}
          />
        </div>

        {/* Sidebar Clinic List — scrollable but scrollbar hidden */}
        <div
          ref={sidebarRef}
          className={cn(
            "flex-col gap-4 overflow-y-auto no-scrollbar px-1.5 py-1.5 h-[550px] lg:h-auto w-full",
            mobileView === 'list' ? 'flex' : 'hidden lg:flex'
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredClinics.map((clinic) => (
            <div
              key={clinic.id}
              ref={(el) => { cardRefs.current[clinic.id] = el }}
            >
              <ClinicCard
                id={clinic.id}
                name={clinic.name}
                address={clinic.address}
                phone={clinic.phone}
                gallery={clinic.clinic_gallery}
                feedback={clinic.feedback}
                isOpen={getEffectiveClinicStatus(clinic.manual_status, clinic.clinic_operating_hours) === 'open'}
                operatingHours={clinic.clinic_operating_hours}
                onClick={() => setActiveClinicId(clinic.id)}
                bookingHref={bookingHref}
                className={cn(
                  "shrink-0 transition-all duration-150 w-full",
                  activeClinicId === clinic.id
                    ? "ring-[2.5px] ring-blue-600 shadow-md"
                    : "hover:ring-2 hover:ring-blue-200 hover:shadow-md"
                )}
              />
            </div>
          ))}
          {filteredClinics.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 bg-white rounded-xl border border-slate-100 min-h-[200px]">
              <MapPin className="w-8 h-8 opacity-20" />
              <p className="text-sm font-medium">No clinics match your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toggle Button for Mobile */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setMobileView(v => v === 'list' ? 'map' : 'list')}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white font-semibold shadow-xl hover:bg-slate-800 transition active:scale-95 text-sm"
        >
          {mobileView === 'list' ? (
            <>
              <Navigation className="w-4 h-4 text-blue-400" />
              <span>Show Map</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Show List</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
