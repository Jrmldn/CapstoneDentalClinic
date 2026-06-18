'use client'

import React from 'react'
import { Star, MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useClinicCard } from './useClinicCard'
import ImageSlider from './ImageSlider'
import { formatTo12h } from './clinicCardHelpers'

export interface ClinicCardProps {
  id: string
  name: string
  address: string
  phone: string
  specialties?: { specialty_name: string }[]
  gallery?: { image_url: string; sort_order: number }[]
  feedback?: { rating: number }[]
  isOpen?: boolean
  operatingHours?: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }[]
  className?: string
  compact?: boolean
  onClick?: () => void
}

/**
 * ClinicCard Component
 * Presentational UI component displaying clinic details, specialties, schedules, and images.
 * Delegates slider logic and scheduling calculations to useClinicCard hook.
 */
export function ClinicCard({ 
  id, name, address, phone, specialties, gallery, 
  feedback, isOpen, operatingHours, className, compact, onClick 
}: ClinicCardProps) {
  const {
    images,
    currentImgIndex,
    handleNextImg,
    handlePrevImg,
    rating,
    todaySchedule,
  } = useClinicCard({ gallery, feedback, operatingHours })

  return (
    <div
      className={cn(
        "bg-white rounded-lg transition-all duration-300 overflow-hidden border border-slate-200 flex flex-col group",
        compact ? "shadow-none border-none w-[240px] p-2.5" : "shadow-md hover:shadow-lg",
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick}
    >
      {/* Image Slider */}
      <ImageSlider
        images={images}
        name={name}
        compact={compact}
        currentImgIndex={currentImgIndex}
        handlePrevImg={handlePrevImg}
        handleNextImg={handleNextImg}
      />
      
      <div className={cn("flex-1 flex flex-col", compact ? "pt-3 px-1 pb-1" : "p-5")}>
        {/* Title and Badge Row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className={cn("font-bold text-slate-900 truncate", compact ? "text-[15px]" : "text-xl")}>
              {name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className={cn("fill-amber-400 text-amber-400", compact ? "w-3 h-3" : "w-4 h-4")} />
              <span className={cn("font-bold text-slate-900", compact ? "text-[12px]" : "text-sm")}>
                {rating > 0 ? rating : 'New'}
              </span>
              <span className={cn("text-slate-500 font-medium", compact ? "text-[11px]" : "text-[13px]")}>
                ({feedback?.length || 0} reviews)
              </span>
            </div>
          </div>
          <Badge className={cn(
            "font-bold shrink-0", 
            compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-0.5",
            isOpen ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
          )}>
            {isOpen ? 'OPEN' : 'CLOSED'}
          </Badge>
        </div>

        {/* Specialties */}
        {specialties && specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {specialties.map((spec, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className={cn(
                  "bg-blue-50 text-blue-600 border-blue-100 py-0.5 font-semibold shrink-0",
                  compact ? "text-[9px]" : "text-[11px]"
                )}
              >
                {spec.specialty_name}
              </Badge>
            ))}
          </div>
        )}

        {/* Details Section */}
        <div className={cn("space-y-2.5 text-slate-800 mb-5", compact ? "text-[12px]" : "text-sm")}>
          <div className="flex items-start gap-2">
            <MapPin className={cn("text-blue-600 shrink-0", compact ? "w-3.5 h-3.5 mt-0.5" : "w-4 h-4 mt-0.5")} />
            <span className="leading-relaxed">{address}</span>
          </div>
          

          <div className="flex items-center gap-2">
            <Clock className={cn("text-blue-600 shrink-0", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
            <span className="font-medium">
              {(!todaySchedule || todaySchedule.is_closed)
                ? "Closed today"
                : `${formatTo12h(todaySchedule.open_time)} - ${formatTo12h(todaySchedule.close_time)}`}
            </span>
          </div>
        </div>
        
        <a
          href="/login"
          onClick={(e) => {
            // Let the global listener handle smooth navigation to avoid "no router context" errors in Leaflet popups
          }}
          className={cn(
            "popup-book-btn inline-flex items-center justify-center w-full bg-blue-600 !text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm mt-auto",
            compact ? "h-9 text-[12px]" : "h-11 text-sm"
          )}
        >
          Book Appointment
        </a>
      </div>
    </div>
  )
}
