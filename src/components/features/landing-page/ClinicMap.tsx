'use client'

import React, { useRef, useEffect } from 'react'
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
export const ClinicMap = ({ clinics, availableSpecialties, availableHMOs }: ClinicMapProps) => {
  const {
    selectedSpecialty,
    setSelectedSpecialty,
    selectedHMO,
    setSelectedHMO,
    showOpenOnly,
    setShowOpenOnly,
    minRating,
    setMinRating,
    activeClinicId,
    setActiveClinicId,
    isMapReady,
    specialtyOptions,
    hmoOptions,
    filteredClinics,
    handleMapReady,
  } = useClinicFilters({ clinics, availableSpecialties, availableHMOs })

  // Refs for sidebar scroll-into-view behaviour
  const sidebarRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<{ [id: string]: HTMLDivElement | null }>({})

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
        selectedSpecialty={selectedSpecialty}
        setSelectedSpecialty={setSelectedSpecialty}
        specialtyOptions={specialtyOptions}
        selectedHMO={selectedHMO}
        setSelectedHMO={setSelectedHMO}
        hmoOptions={hmoOptions}
        minRating={minRating}
        setMinRating={setMinRating}
        showOpenOnly={showOpenOnly}
        setShowOpenOnly={setShowOpenOnly}
      />

      <div className="grid lg:grid-cols-3 gap-6 h-[650px]">
        {/* Main Map Container */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-slate-50 relative min-h-[400px]">
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
          />
        </div>

        {/* Sidebar Clinic List — scrollable but scrollbar hidden */}
        <div
          ref={sidebarRef}
          className="flex flex-col gap-4 overflow-y-auto no-scrollbar px-1.5 py-1.5"
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
                specialties={clinic.clinic_specialties}
                gallery={clinic.clinic_gallery}
                feedback={clinic.feedback}
                isOpen={getEffectiveClinicStatus(clinic.manual_status, clinic.clinic_operating_hours) === 'open'}
                hmos={clinic.clinic_hmo}
                operatingHours={clinic.clinic_operating_hours}
                onClick={() => setActiveClinicId(clinic.id)}
                className={cn(
                  "shrink-0 transition-all duration-150",
                  activeClinicId === clinic.id
                    ? "ring-[2.5px] ring-blue-600 shadow-md"
                    : "hover:ring-2 hover:ring-blue-200 hover:shadow-md"
                )}
              />
            </div>
          ))}
          {filteredClinics.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 bg-white rounded-xl border border-slate-100">
              <MapPin className="w-8 h-8 opacity-20" />
              <p className="text-sm font-medium">No clinics match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
