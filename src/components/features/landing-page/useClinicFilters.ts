import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clinic } from './types'
import { DEFAULT_SPECIALTY, DEFAULT_HMO } from './constants'
import { getEffectiveClinicStatus } from '@/lib/clinicStatus'

interface UseClinicFiltersProps {
  clinics: Clinic[]
  availableSpecialties?: string[]
  availableHMOs?: string[]
}

/**
 * Custom Hook: useClinicFilters
 * Manages all filtering logic, state, and side-effects for the Clinic Map and sidebar.
 */
export const useClinicFilters = ({
  clinics,
  availableSpecialties,
  availableHMOs,
}: UseClinicFiltersProps) => {
  const router = useRouter()
  const [selectedSpecialty, setSelectedSpecialty] = useState(DEFAULT_SPECIALTY)
  const [selectedHMO, setSelectedHMO] = useState(DEFAULT_HMO)
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [activeClinicId, setActiveClinicId] = useState<string | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  // Memoized Filter Options
  const specialtyOptions = useMemo(() => {
    if (availableSpecialties && availableSpecialties.length > 0) {
      return [DEFAULT_SPECIALTY, ...availableSpecialties]
    }
    const specs = new Set<string>([DEFAULT_SPECIALTY])
    clinics.forEach((c) =>
      c.clinic_specialties?.forEach((s) => specs.add(s.specialty_name))
    )
    return Array.from(specs).sort()
  }, [clinics, availableSpecialties])

  const hmoOptions = useMemo(() => {
    if (availableHMOs && availableHMOs.length > 0) {
      return [DEFAULT_HMO, ...availableHMOs]
    }
    const hmos = new Set<string>([DEFAULT_HMO])
    clinics.forEach((c) => c.clinic_hmo?.forEach((h) => hmos.add(h.hmo_name)))
    return Array.from(hmos).sort()
  }, [clinics, availableHMOs])

  // Memoized Filtered List
  const filteredClinics = useMemo(() => {
    return clinics.filter((clinic) => {
      const ratingCount = clinic.feedback?.length || 0
      const rating =
        ratingCount > 0
          ? clinic.feedback.reduce((sum, f) => sum + f.rating, 0) / ratingCount
          : 0

      const isOpen =
        getEffectiveClinicStatus(
          clinic.manual_status,
          clinic.clinic_operating_hours
        ) === 'open'

      const matchSpecialty =
        selectedSpecialty === DEFAULT_SPECIALTY ||
        clinic.clinic_specialties?.some(
          (s) => s.specialty_name === selectedSpecialty
        )

      const matchHMO =
        selectedHMO === DEFAULT_HMO ||
        clinic.clinic_hmo?.some((h) => h.hmo_name === selectedHMO)

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

  return {
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
  }
}
