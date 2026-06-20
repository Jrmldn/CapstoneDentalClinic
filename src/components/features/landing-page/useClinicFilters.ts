import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clinic } from './types'
import { DEFAULT_SPECIALTY } from './constants'
import { getEffectiveClinicStatus } from '@/lib/clinicStatus'

interface UseClinicFiltersProps {
  clinics: Clinic[]
  availableSpecialties?: string[]
}

export const useClinicFilters = ({
  clinics,
  availableSpecialties,
}: UseClinicFiltersProps) => {
  const router = useRouter()
  const [selectedSpecialty, setSelectedSpecialty] = useState(DEFAULT_SPECIALTY)
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

      const matchOpen = !showOpenOnly || isOpen
      const matchRating = rating >= minRating

      return matchSpecialty && matchOpen && matchRating
    })
  }, [clinics, selectedSpecialty, showOpenOnly, minRating])

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
    showOpenOnly,
    setShowOpenOnly,
    minRating,
    setMinRating,
    activeClinicId,
    setActiveClinicId,
    isMapReady,
    specialtyOptions,
    filteredClinics,
    handleMapReady,
  }
}
