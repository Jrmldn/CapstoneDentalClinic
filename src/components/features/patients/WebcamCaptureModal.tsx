'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, X } from 'lucide-react'

interface WebcamCaptureModalProps {
  onCapture: (blob: Blob) => void
  onClose: () => void
}

export default function WebcamCaptureModal({ onCapture, onClose }: WebcamCaptureModalProps) {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setError('Unable to access camera. Check your browser permissions.'))

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  const handleCapture = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (blob) onCapture(blob)
    }, 'image/jpeg', 0.92)
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xs">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="text-sm font-bold text-white">Take Photo</p>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <p className="text-sm text-red-300 font-medium text-center max-w-xs">{error}</p>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="max-h-full max-w-full rounded-lg" />
        )}
      </div>

      {!error && (
        <div className="flex items-center justify-center px-4 py-4 border-t border-white/10">
          <button
            onClick={handleCapture}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition"
          >
            <Camera className="w-4 h-4" />
            Capture
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}
