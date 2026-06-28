import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clinic } from './types'
import { getEffectiveClinicStatus } from '@/lib/clinicStatus'

interface UseClinicFiltersProps {
  clinics: Clinic[]
}

export const useClinicFilters = ({
  clinics,
}: UseClinicFiltersProps) => {
  const router = useRouter()
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [activeClinicId, setActiveClinicId] = useState<number | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

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

      const matchOpen = !showOpenOnly || isOpen
      const matchRating = rating >= minRating

      return matchOpen && matchRating
    })
  }, [clinics, showOpenOnly, minRating])

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
    showOpenOnly,
    setShowOpenOnly,
    minRating,
    setMinRating,
    activeClinicId,
    setActiveClinicId,
    isMapReady,
    filteredClinics,
    handleMapReady,
  }
}
