'use client'

import { useState } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import type { Appointment } from './AppointmentTypes'

interface CancelModalProps {
  appointment: Appointment | null
  onClose: () => void
  userId: string
  onSuccess: (apptId: number, reason: string) => void
}

export default function CancelModal({
  appointment,
  onClose,
  userId,
  onSuccess
}: CancelModalProps) {
  const [cancelReason, setCancelReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment) return
    setIsSubmitting(true)
    const cancelResult = await updateAppointmentStatus(
      appointment.id,
      'cancelled',
      userId,
      'staff',
      cancelReason || 'Cancelled by staff'
    )
    setIsSubmitting(false)
    if (cancelResult.success) {
      onSuccess(appointment.id, cancelReason)
      setCancelReason('')
    } else {
      alert(cancelResult.error || 'Failed to cancel appointment')
    }
  }

  if (!appointment) return null

  return (
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-lg">Cancel Appointment</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleCancelSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800">Reason for Cancellation</label>
            <textarea
              required
              placeholder="Provide reason for cancelling (e.g. Patient emergency, out of town)..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              Go Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !cancelReason}
              className="px-5 py-2 bg-red-650 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm disabled:opacity-55 flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
