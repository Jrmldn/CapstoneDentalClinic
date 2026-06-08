'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2, Plus, X, GripVertical, ImageIcon } from 'lucide-react'
import { manageClinicGallery } from '@/actions/clinicSetupActions'

interface GalleryItem {
  url: string
  sort_order: number
}

interface Props {
  clinicId: number
  gallery: Record<string, unknown>[]
}

export default function GalleryForm({ clinicId, gallery }: Props) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [urlInput, setUrlInput] = useState('')

  const [images, setImages] = useState<GalleryItem[]>(
    gallery.map((g, i) => ({ url: String(g.image_url), sort_order: Number(g.sort_order ?? i) }))
      .sort((a, b) => a.sort_order - b.sort_order)
  )

  const addImage = () => {
    const url = urlInput.trim()
    if (!url) return
    setImages(prev => [...prev, { url, sort_order: prev.length }])
    setUrlInput('')
  }

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx).map((img, i) => ({ ...img, sort_order: i })))
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

  const handleSave = () => {
    setMsg(null)
    startTransition(async () => {
      const r = await manageClinicGallery(clinicId, images)
      setMsg(r.success
        ? { type: 'success', text: 'Gallery saved successfully.' }
        : { type: 'error', text: r.error ?? 'Failed to save gallery.' })
    })
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h2 className="text-base font-semibold text-slate-800">Clinic Gallery</h2>

      {/* Add image */}
      <div className="flex gap-2">
        <input
          id="gallery-url-input"
          type="url"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
          placeholder="Paste image URL…"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          id="add-gallery-image-btn"
          type="button"
          onClick={addImage}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Image list */}
      {images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center gap-2 text-gray-400">
          <ImageIcon className="w-8 h-8" />
          <p className="text-sm">No images in gallery yet.</p>
          <p className="text-xs">Paste an image URL above to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
            >
              {/* Preview */}
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>

              {/* URL truncated */}
              <p className="flex-1 text-xs text-gray-600 truncate">{img.url}</p>

              {/* Order badge */}
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-500">
                #{idx + 1}
              </span>

              {/* Controls */}
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
                  onClick={() => removeImage(idx)}
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

      <div className="flex justify-end">
        <button
          id="save-gallery-btn"
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Saving…' : 'Save Gallery'}
        </button>
      </div>
    </div>
  )
}
