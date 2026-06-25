import { useState, useMemo } from 'react'

interface UseClinicCardProps {
  gallery?: { image_url: string; sort_order: number | null }[]
  feedback?: { rating: number }[]
  operatingHours?: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean | null }[]
}

/**
 * Custom Hook: useClinicCard
 * Manages slider state, average rating computation, and date-based scheduling.
 */
export const useClinicCard = ({
  gallery,
  feedback,
  operatingHours,
}: UseClinicCardProps) => {
  const images = useMemo(() => {
    return (gallery || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [gallery])

  const [currentImgIndex, setCurrentImgIndex] = useState(0)

  const handleNextImg = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImgIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrevImg = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const rating = useMemo(() => {
    if (!feedback?.length) return 0
    const total = feedback.reduce((sum, item) => sum + item.rating, 0)
    return parseFloat((total / feedback.length).toFixed(1))
  }, [feedback])

  const todaySchedule = useMemo(() => {
    return operatingHours?.find((h) => h.day_of_week === new Date().getDay())
  }, [operatingHours])

  return {
    images,
    currentImgIndex,
    handleNextImg,
    handlePrevImg,
    rating,
    todaySchedule,
  }
}
