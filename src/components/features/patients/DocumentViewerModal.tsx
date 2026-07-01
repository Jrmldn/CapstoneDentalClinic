'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react'
import { formatDateTime } from '@/lib/date'
import type { PatientDocument } from '@/actions/patientDocumentActions'

interface DocumentViewerModalProps {
  doc: PatientDocument
  onClose: () => void
}

export default function DocumentViewerModal({ doc, onClose }: DocumentViewerModalProps) {
  const [mounted, setMounted] = useState(false)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const pinchState = useRef<{ startDistance: number; startScale: number } | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const resetTransform = () => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setScale(prev => Math.min(4, Math.max(1, prev - e.deltaY * 0.0015)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: translate.x, originY: translate.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    setTranslate({ x: dragState.current.originX + dx, y: dragState.current.originY + dy })
  }

  const handleMouseUp = () => { dragState.current = null }

  const touchDistance = (touches: React.TouchList) => {
    const [a, b] = [touches[0], touches[1]]
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchState.current = { startDistance: touchDistance(e.touches), startScale: scale }
    } else if (e.touches.length === 1 && scale > 1) {
      dragState.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        originX: translate.x,
        originY: translate.y,
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchState.current) {
      const distance = touchDistance(e.touches)
      const ratio = distance / pinchState.current.startDistance
      setScale(Math.min(4, Math.max(1, pinchState.current.startScale * ratio)))
    } else if (e.touches.length === 1 && dragState.current) {
      const dx = e.touches[0].clientX - dragState.current.startX
      const dy = e.touches[0].clientY - dragState.current.startY
      setTranslate({ x: dragState.current.originX + dx, y: dragState.current.originY + dy })
    }
  }

  const handleTouchEnd = () => {
    dragState.current = null
    pinchState.current = null
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xs">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="text-white min-w-0">
          <p className="text-sm font-bold truncate">{doc.fileName}</p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {formatDateTime(doc.createdAt)} · Uploaded by {doc.uploadedByName} ({doc.uploadedByBranch})
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {doc.fileType === 'image' && (
            <>
              <button
                onClick={() => setScale(prev => Math.max(1, prev - 0.5))}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setScale(prev => Math.min(4, prev + 0.5))}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          )}
          <a
            href={doc.url}
            download={doc.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex items-center justify-center">
        {doc.fileType === 'pdf' ? (
          <iframe src={doc.url} className="w-full h-full bg-white" title={doc.fileName} />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={resetTransform}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doc.url}
              alt={doc.fileName}
              draggable={false}
              className="max-h-full max-w-full object-contain select-none"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                cursor: scale > 1 ? 'grab' : 'default',
              }}
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
