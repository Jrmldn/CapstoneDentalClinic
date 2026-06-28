'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, RefreshCw } from 'lucide-react'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import { useAvailableSlots, MILLISECONDS_PER_MINUTE } from './hooks/useAvailableSlots'
import { toDateKey, formatDateTime, formatTo12h } from '@/lib/date'
import type { Appointment } from './AppointmentTypes'

interface RescheduleModalProps {
  appointment: Appointment | null
  onClose: () => void
  userId: string
  clinicId: number
  onSuccess: () => void
}

export default function RescheduleModal({
  appointment,
  onClose,
  userId,
  clinicId,
  onSuccess
}: RescheduleModalProps) {
  const [rescheduleDate, setRescheduleDate] = useState('')
  const { slots: rescheduleSlots, fetchSlots } = useAvailableSlots(clinicId)
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment || !rescheduleDate || !selectedRescheduleSlot) return

    setIsSubmitting(true)

    const service = appointment.services
    const duration = service?.slot_duration_min || 30
    const startIso = `${rescheduleDate}T${selectedRescheduleSlot}:00`
    const startDateObj = new Date(startIso)
    const endDateObj = new Date(startDateObj.getTime() + duration * MILLISECONDS_PER_MINUTE)
    const endIso = endDateObj.toISOString()

    const rescheduleResult = await updateAppointmentStatus(
      appointment.id,
      'pending_patient_confirm',
      userId,
      'staff',
      'Rescheduled by staff — awaiting patient confirmation',
      startDateObj.toISOString(),
      endIso
    )
    setIsSubmitting(false)

    if (rescheduleResult.success) {
      onSuccess()
    } else {
      alert(rescheduleResult.error || 'Failed to reschedule appointment')
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !appointment) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-lg">Reschedule Appointment</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-5">
          <div className="bg-blue-50 border border-blue-150 p-3 rounded-lg text-xs text-blue-800 space-y-1">
            <p className="font-bold">Current Appointment Details:</p>
            <p>Patient: {appointment.patients ? `${appointment.patients.first_name} ${appointment.patients.last_name}` : 'Unknown'}</p>
            <p>Service: {appointment.services?.name}</p>
            <p>Current Time: {formatDateTime(appointment.scheduled_at)}</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-805">New Date *</label>
            <input
              type="date"
              required
              min={toDateKey()}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-550"
              value={rescheduleDate}
              onChange={(e) => {
                setRescheduleDate(e.target.value)
                setSelectedRescheduleSlot('')
                if (appointment.dentists?.id && appointment.services?.id) {
                  fetchSlots(appointment.dentists.id, appointment.services.id, e.target.value)
                }
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800">Available Slots *</label>
            {rescheduleDate && appointment.dentists?.id && appointment.services?.id ? (
              rescheduleSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto border border-gray-100 p-2 rounded-lg bg-gray-50">
                  {rescheduleSlots.map(slot => (
                    <button
                      key={slot.start}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedRescheduleSlot(slot.start)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition ${
                        selectedRescheduleSlot === slot.start
                          ? 'bg-blue-600 text-white shadow-sm'
                          : slot.available
                          ? 'bg-white border border-gray-200 text-slate-700 hover:border-blue-500 hover:text-blue-600'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {formatTo12h(slot.start)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                  No slots available on this date.
                </p>
              )
            ) : (
              <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded border border-gray-100 text-center">
                Select a date to view slots.
              </p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedRescheduleSlot}
              className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Update Time'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
