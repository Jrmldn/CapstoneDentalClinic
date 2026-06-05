'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Navigation } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import { getEffectiveClinicStatus } from '@/lib/clinicStatus'
import { ClinicCard } from '@/app/components/ClinicCard'

// Dynamically import LeafletMapInner without the loading prop to avoid Next.js dynamic loader hangs
const LeafletMapInner = dynamic(
  () => import('./LeafletMapInner'),
  { ssr: false }
)

interface ClinicSpecialty {
  specialty_name: string
}

interface ClinicHMO {
  hmo_name: string
}

interface ClinicOperatingHour {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

interface ClinicGallery {
  image_url: string
  sort_order: number
}

interface ClinicFeedback {
  rating: number
}

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  manual_status: string | null
  latitude: number | null
  longitude: number | null
  clinic_hmo: ClinicHMO[]
  clinic_specialties: ClinicSpecialty[]
  clinic_operating_hours: ClinicOperatingHour[]
  clinic_gallery: ClinicGallery[]
  feedback: ClinicFeedback[]
}

interface ClinicMapProps {
  clinics: Clinic[]
  availableSpecialties?: string[]
  availableHMOs?: string[]
}

interface FilterSectionProps {
  selectedSpecialty: string
  setSelectedSpecialty: (val: string) => void
  specialtyOptions: string[]
  selectedHMO: string
  setSelectedHMO: (val: string) => void
  hmoOptions: string[]
  minRating: number
  setMinRating: (val: number) => void
  showOpenOnly: boolean
  setShowOpenOnly: (val: boolean) => void
}

// Sub-component: Clinic Filter Section
const FilterSection = ({
  selectedSpecialty, setSelectedSpecialty, specialtyOptions,
  selectedHMO, setSelectedHMO, hmoOptions,
  minRating, setMinRating,
  showOpenOnly, setShowOpenOnly
}: FilterSectionProps) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Specialty</label>
        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {specialtyOptions.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HMO / Health Card</label>
        <select
          value={selectedHMO}
          onChange={(e) => setSelectedHMO(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {hmoOptions.map((hmo) => <option key={hmo} value={hmo}>{hmo}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Minimum Rating</label>
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all"
        >
          <option value={0}>All Ratings</option>
          <option value={4.0}>4.0+ Stars</option>
          <option value={4.5}>4.5+ Stars</option>
          <option value={4.8}>4.8+ Stars</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
        <label className={cn(
          "flex items-center gap-3 px-4 h-[42px] border rounded-lg cursor-pointer transition-all",
          showOpenOnly ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"
        )}>
          <input
            type="checkbox"
            checked={showOpenOnly}
            onChange={(e) => setShowOpenOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm font-medium text-slate-700">Open Now Only</span>
        </label>
      </div>
    </div>
  </div>
)

export const ClinicMap = ({ clinics, availableSpecialties, availableHMOs }: ClinicMapProps) => {
  const router = useRouter()
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties")
  const [selectedHMO, setSelectedHMO] = useState("All HMOs")
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [activeClinicId, setActiveClinicId] = useState<string | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  // Memoized Filter Options
  const specialtyOptions = useMemo(() => {
    if (availableSpecialties && availableSpecialties.length > 0) {
      return ["All Specialties", ...availableSpecialties]
    }
    const specs = new Set<string>(["All Specialties"])
    clinics.forEach(c => c.clinic_specialties?.forEach(s => specs.add(s.specialty_name)))
    return Array.from(specs).sort()
  }, [clinics, availableSpecialties])

  const hmoOptions = useMemo(() => {
    if (availableHMOs && availableHMOs.length > 0) {
      return ["All HMOs", ...availableHMOs]
    }
    const hmos = new Set<string>(["All HMOs"])
    clinics.forEach(c => c.clinic_hmo?.forEach(h => hmos.add(h.hmo_name)))
    return Array.from(hmos).sort()
  }, [clinics, availableHMOs])

  // Memoized Filtered List
  const filteredClinics = useMemo(() => {
    return clinics.filter((clinic) => {
      const ratingCount = clinic.feedback?.length || 0
      const rating = ratingCount > 0 
        ? clinic.feedback.reduce((sum, f) => sum + f.rating, 0) / ratingCount 
        : 0
      
      const isOpen = getEffectiveClinicStatus(clinic.manual_status, clinic.clinic_operating_hours) === 'open'

      const matchSpecialty = selectedSpecialty === "All Specialties" ||
        clinic.clinic_specialties?.some(s => s.specialty_name === selectedSpecialty)

      const matchHMO = selectedHMO === "All HMOs" ||
        clinic.clinic_hmo?.some(h => h.hmo_name === selectedHMO)

      const matchOpen = !showOpenOnly || isOpen
      const matchRating = rating >= minRating

      return matchSpecialty && matchHMO && matchOpen && matchRating
    })
  }, [clinics, selectedSpecialty, selectedHMO, showOpenOnly, minRating])

  // Handle BFCACHE and global popup clicks
  useEffect(() => {
    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.matches('.popup-book-btn')) {
        e.preventDefault()
        const href = target.getAttribute('href')
        if (href) router.push(href)
      }
    }

    window.addEventListener('click', handlePopupClick)
    return () => window.removeEventListener('click', handlePopupClick)
  }, [router])

  // Map readiness callback
  const handleMapReady = useCallback(() => {
    setIsMapReady(true)
  }, [])

  return (
    <div className="space-y-6">
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

        {/* Sidebar Clinic List */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {filteredClinics.map((clinic) => (
            <ClinicCard
              key={clinic.id}
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
              className={cn(
                "shrink-0",
                activeClinicId === clinic.id ? "ring-2 ring-blue-500 shadow-md" : ""
              )}
            />
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
