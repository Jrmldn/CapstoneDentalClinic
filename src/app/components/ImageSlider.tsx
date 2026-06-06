import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageSliderProps {
  images: { image_url: string; sort_order: number }[]
  name: string
  compact?: boolean
  currentImgIndex: number
  handlePrevImg: (e: React.MouseEvent) => void
  handleNextImg: (e: React.MouseEvent) => void
}

/**
 * ImageSlider Component
 * Renders the gallery images and handles slide controls.
 */
export default function ImageSlider({
  images,
  name,
  compact,
  currentImgIndex,
  handlePrevImg,
  handleNextImg,
}: ImageSliderProps) {
  if (images.length === 0) return null

  return (
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
  )
}
