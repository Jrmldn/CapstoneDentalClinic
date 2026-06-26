'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Ban, Loader2, X } from 'lucide-react'
import { updateClinicStatus } from '@/actions/clinicActions'
import { Clinic } from '@/types/clinic'

interface Props {
  clinic: Clinic | null
  onClose: () => void
  onSuccess: () => void
}

export default function DisableClinicModal({ clinic, onClose, onSuccess }: Props) {
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!clinic) {
      setInput('')
      setError(null)
    }
  }, [clinic])

  if (!mounted || !clinic) return null

  const handleConfirm = async () => {
    if (input !== 'DELETE') return
    setIsSubmitting(true)
    setError(null)
    const result = await updateClinicStatus(clinic.id, false)
    setIsSubmitting(false)
    if (result.success) {
      onSuccess()
      onClose()
    } else {
      setError(result.error ?? 'Failed to disable clinic.')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Disable Clinic</h2>
              <p className="text-sm text-gray-500">{clinic.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Disabling this clinic will mark it as inactive. Type{' '}
          <span className="font-mono font-bold text-red-600">DELETE</span> below to confirm.
        </p>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
        />

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={input !== 'DELETE' || isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            {isSubmitting ? 'Disabling…' : 'Disable Clinic'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
