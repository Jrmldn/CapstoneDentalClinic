'use client'

import { useState, useRef } from 'react'
import { Loader2, X, GripVertical, ImageIcon, Upload } from 'lucide-react'
import {
  uploadClinicGalleryImage,
  deleteClinicGalleryImage,
  reorderClinicGalleryImages,
} from '@/actions/clinicSetupActions'

interface GalleryItem {
  id: number
  url: string
  filename: string
  sort_order: number
}

interface Props {
  clinicId: number
  gallery: Record<string, unknown>[]
}

export default function GalleryForm({ clinicId, gallery }: Props) {
  const [images, setImages] = useState<GalleryItem[]>(
    gallery
      .map((g) => ({
        id: Number(g.id),
        url: String(g.image_url),
        filename: String(g.image_url).split('/').pop() ?? '',
        sort_order: Number(g.sort_order ?? 0),
      }))
      .sort((a, b) => a.sort_order - b.sort_order)
  )

  const [uploading, setUploading] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelected = async (file: File) => {
    setUploadError(null)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be under 5 MB.')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadClinicGalleryImage(clinicId, formData)
    setUploading(false)
    if (result.success && result.row) {
      const row = result.row as Record<string, unknown>
      setImages(prev => [
        ...prev,
        {
          id: Number(row.id),
          url: String(row.image_url),
          filename: String(row.image_url).split('/').pop() ?? '',
          sort_order: Number(row.sort_order ?? prev.length),
        },
      ])
    } else {
      setUploadError(result.error ?? 'Upload failed.')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelected(file)
  }

  const handleDelete = async (item: GalleryItem) => {
    const result = await deleteClinicGalleryImage(item.id, item.url)
    if (result.success) {
      setImages(prev => prev.filter(i => i.id !== item.id).map((img, i) => ({ ...img, sort_order: i })))
    } else {
      setMsg({ type: 'error', text: result.error ?? 'Delete failed.' })
    }
  }

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setImages(prev => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next.map((img, i) => ({ ...img, sort_order: i }))
    })
  }

  const moveDown = (idx: number) => {
    setImages(prev => {
      if (idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next.map((img, i) => ({ ...img, sort_order: i }))
    })
  }

  const handleSaveOrder = async () => {
    setReordering(true)
    setMsg(null)
    const result = await reorderClinicGalleryImages(images.map(({ id, sort_order }) => ({ id, sort_order })))
    setReordering(false)
    setMsg(result.success
      ? { type: 'success', text: 'Order saved.' }
      : { type: 'error', text: result.error ?? 'Failed to save order.' })
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h2 className="text-base font-semibold text-slate-800">Clinic Gallery</h2>

      {/* Upload area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-2 text-gray-400 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition"
      >
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-blue-600">Uploading…</p>
            <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse rounded-full" style={{ width: '60%' }} />
            </div>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8" />
            <p className="text-sm font-medium text-gray-600">Click or drag &amp; drop an image</p>
            <p className="text-xs">PNG, JPG, WEBP — max 5 MB</p>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelected(file)
          e.target.value = ''
        }}
      />

      {uploadError && (
        <p className="text-sm text-red-600">{uploadError}</p>
      )}

      {/* Image list */}
      {images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-2 text-gray-400">
          <ImageIcon className="w-8 h-8" />
          <p className="text-sm">No images in gallery yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>

              <p className="flex-1 text-xs text-gray-600 truncate">{img.filename}</p>

              <span className="text-[10px] font-semibold px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-500">
                #{idx + 1}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition"
                  title="Move up"
                >
                  <GripVertical className="w-3 h-3 rotate-90 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === images.length - 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition"
                  title="Move down"
                >
                  <GripVertical className="w-3 h-3 -rotate-90 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(img)}
                  className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      {images.length > 0 && (
        <div className="flex justify-end">
          <button
            id="save-order-btn"
            type="button"
            onClick={handleSaveOrder}
            disabled={reordering}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {reordering ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {reordering ? 'Saving…' : 'Save Order'}
          </button>
        </div>
      )}
    </div>
  )
}
