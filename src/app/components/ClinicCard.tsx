'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Star, MapPin, CreditCard, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface ClinicCardProps {
  id: string
  name: string
  address: string
  phone: string
  specialties?: { specialty_name: string }[]
  gallery?: { image_url: string; sort_order: number }[]
  feedback?: { rating: number }[]
  isOpen?: boolean
  hmos?: { hmo_name: string }[]
  operatingHours?: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }[]
  className?: string
  compact?: boolean
}

// Helper: Format 24h time to 12h AM/PM
const formatTo12h = (time: string) => {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

export function ClinicCard({ 
  id, name, address, phone, specialties, gallery, 
  feedback, isOpen, hmos, operatingHours, className, compact 
}: ClinicCardProps) {
  const images = useMemo(() => {
    return (gallery || []).sort((a, b) => a.sort_order - b.sort_order)
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

  return (
    <div className={cn(
      "bg-white rounded-lg transition-all duration-300 overflow-hidden border border-slate-200 flex flex-col group",
      compact ? "shadow-none border-none w-[240px] p-2.5" : "shadow-md hover:shadow-lg",
      className
    )}>
      {/* Image Slider */}
      {images.length > 0 && (
        <div className={cn(
          "w-full relative overflow-hidden bg-slate-100 rounded-lg",
          compact ? "h-28" : "h-40"
        )}>
          <img 
            src={images[currentImgIndex].image_url} 
            alt={`${name} - ${currentImgIndex + 1}`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {images.length > 1 && (
            <>
              <button 
                onClick={handlePrevImg}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-white/80 text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
              >
                <ChevronLeft className={compact ? "w-3.5 h-3.5" : "w-5 h-5"} />
              </button>
              <button 
                onClick={handleNextImg}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-white/80 text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
              >
                <ChevronRight className={compact ? "w-3.5 h-3.5" : "w-5 h-5"} />
              </button>
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "rounded-full transition-all",
                      compact ? "w-1 h-1" : "w-1.5 h-1.5",
                      i === currentImgIndex ? "bg-white" : "bg-white/40"
                    )} 
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
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
          
          {hmos && hmos.length > 0 && (
            <div className="flex items-start gap-2">
              <CreditCard className={cn("text-blue-600 shrink-0", compact ? "w-3.5 h-3.5 mt-0.5" : "w-4 h-4 mt-0.5")} />
              <span className="leading-relaxed">
                {hmos.map(h => h.hmo_name).join(", ")}
              </span>
            </div>
          )}

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
          href={`/login?clinic=${id}`}
          onClick={(e) => {
            // Let the global listener in ClinicMap handle smooth navigation
            // This prevents "no router context" errors when rendered in Leaflet popups
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
