'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Star, Clock, CreditCard, Navigation, Briefcase } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

// Dynamically import LeafletMapInner with SSR disabled
const LeafletMapInner = dynamic(
  () => import('./LeafletMapInner'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-sm">Initializing Map...</p>
        </div>
      </div>
    )
  }
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

interface ClinicFeedback {
  rating: number
}

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  latitude: number | null
  longitude: number | null
  clinic_hmo: ClinicHMO[]
  clinic_specialties: ClinicSpecialty[]
  clinic_operating_hours: ClinicOperatingHour[]
  feedback: ClinicFeedback[]
}

interface ClinicMapProps {
  clinics: Clinic[]
}


// Helper: Calculate average rating for a clinic
const calculateAvgRating = (feedback: ClinicFeedback[]) => {
  if (!feedback?.length) return 0
  const total = feedback.reduce((sum, item) => sum + item.rating, 0)
  return parseFloat((total / feedback.length).toFixed(1))
}

// Helper: Check if clinic is currently open based on operating hours
const checkCurrentlyOpen = (operatingHours: ClinicOperatingHour[]) => {
  if (!operatingHours?.length) return false
  const now = new Date()
  const day = now.getDay()
  const currentMinutes = now.getHours() * 100 + now.getMinutes()

  const todaySchedule = operatingHours.find(h => h.day_of_week === day)
  if (!todaySchedule || todaySchedule.is_closed) return false

  const [openH, openM] = todaySchedule.open_time.split(':').map(Number)
  const [closeH, closeM] = todaySchedule.close_time.split(':').map(Number)

  return currentMinutes >= (openH * 100 + openM) && currentMinutes <= (closeH * 100 + closeM)
}

// Helper: Format 24h time to 12h AM/PM
const formatTo12h = (time: string) => {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
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
  <Card className="shadow-md border-slate-200">
    <CardContent className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            Specialty
          </label>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500"
          >
            {specialtyOptions.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-500" />
            HMO / Health Card
          </label>
          <select
            value={selectedHMO}
            onChange={(e) => setSelectedHMO(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500"
          >
            {hmoOptions.map((hmo) => <option key={hmo} value={hmo}>{hmo}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Minimum Rating
          </label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>All Ratings</option>
            <option value={4.0}>4.0+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
            <option value={4.8}>4.8+ Stars</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-500" />
            Status
          </label>
          <label className={cn(
            "flex items-center gap-3 px-4 py-2 border rounded-lg cursor-pointer transition-all h-[42px]",
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
    </CardContent>
  </Card>
)

interface SidebarCardProps {
  clinic: Clinic
  activeClinicId: string | null
  onSelect: (id: string) => void
}

// Sub-component: Individual Clinic Sidebar Card
const SidebarCard = ({ clinic, activeClinicId, onSelect }: SidebarCardProps) => {
  const rating = calculateAvgRating(clinic.feedback)
  const isOpen = checkCurrentlyOpen(clinic.clinic_operating_hours)
  const isActive = activeClinicId === clinic.id

  const todaySchedule = clinic.clinic_operating_hours?.find((h) => h.day_of_week === new Date().getDay())

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 border-slate-200 shrink-0",
        isActive ? "ring-2 ring-blue-500 shadow-md" : "hover:shadow-md"
      )}
      onClick={() => onSelect(clinic.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-base mb-1">{clinic.name}</h3>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-slate-700">{rating > 0 ? rating : 'New'}</span>
              <span className="text-[10px] text-gray-400">({clinic.feedback.length} reviews)</span>
            </div>
          </div>
          <Badge className={cn("text-[10px] px-2 py-0 font-bold", isOpen ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
            {isOpen ? 'OPEN' : 'CLOSED'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {clinic.clinic_specialties?.slice(0, 2).map((spec, i) => ( // FIX: Removed any
            <Badge key={i} variant="outline" className="text-[10px] text-slate-500 py-0">{spec.specialty_name}</Badge>
          ))}
        </div>

        <div className="space-y-2 text-xs text-slate-600 mb-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
            <span className="line-clamp-2">{clinic.address}</span>
          </div>
          {clinic.clinic_hmo && clinic.clinic_hmo.length > 0 && (
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="line-clamp-1">
                {clinic.clinic_hmo.map((h) => h.hmo_name).join(", ")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              {(!todaySchedule || todaySchedule.is_closed)
                ? "Closed today"
                : `${formatTo12h(todaySchedule.open_time)} - ${formatTo12h(todaySchedule.close_time)}`}
            </span>
          </div>
        </div>

        <Link
          href={`/login?clinic=${clinic.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center w-full h-9 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          Book Appointment
        </Link>
      </CardContent>
    </Card>
  )
}

export const ClinicMap = ({ clinics }: ClinicMapProps) => {
  const router = useRouter()
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties")
  const [selectedHMO, setSelectedHMO] = useState("All HMOs")
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [activeClinicId, setActiveClinicId] = useState<string | null>(null)

  // Memoized Filter Options
  const specialtyOptions = useMemo(() => {
    const specs = new Set<string>(["All Specialties"])
    clinics.forEach(c => c.clinic_specialties?.forEach(s => specs.add(s.specialty_name)))
    return Array.from(specs).sort()
  }, [clinics])

  const hmoOptions = useMemo(() => {
    const hmos = new Set<string>(["All HMOs"])
    clinics.forEach(c => c.clinic_hmo?.forEach(h => hmos.add(h.hmo_name)))
    return Array.from(hmos).sort()
  }, [clinics])

  // Memoized Filtered List
  const filteredClinics = useMemo(() => {
    return clinics.filter((clinic) => {
      const rating = calculateAvgRating(clinic.feedback)
      const isOpen = checkCurrentlyOpen(clinic.clinic_operating_hours)

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

  // Stable callback for map readiness to prevent re-initialization
  const handleMapReady = useCallback(() => { }, [])

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
            clinics={filteredClinics}
            onMapReady={handleMapReady}
            activeClinicId={activeClinicId}
            onMarkerClick={setActiveClinicId}
          />
        </div>

        {/* Sidebar Clinic List */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {filteredClinics.map((clinic) => (
            <SidebarCard
              key={clinic.id}
              clinic={clinic}
              activeClinicId={activeClinicId}
              onSelect={setActiveClinicId}
            />
          ))}
          {filteredClinics.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <MapPin className="w-8 h-8 opacity-20" />
              <p className="text-sm font-medium">No clinics match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
