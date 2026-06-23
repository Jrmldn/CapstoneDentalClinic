'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, X, Clock, HelpCircle } from 'lucide-react'
import { createAppointment } from '@/actions/appointmentActions'
import { getAvailableSlots } from '@/actions/slotAvailabilityActions'
import { fetchServices } from '@/actions/serviceActions'
import { toDateKey, formatDate, formatTime } from '@/lib/date'
import type { AppointmentRecord } from './types'

interface FollowupsTabProps {
  patientId: number
  clinicId: number
  dentistId?: number
  appointments: AppointmentRecord[]
  onRefresh: () => Promise<void>
}

interface Service {
  id: number
  name: string
  slot_duration_min: number
}

export default function FollowupsTab({
  patientId,
  clinicId,
  dentistId,
  appointments,
  onRefresh,
}: FollowupsTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<{ start: string; end: string; available: boolean }[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load clinic services on mount
  useEffect(() => {
    async function loadServices() {
      const res = await fetchServices(clinicId)
      if (res.success && res.services) {
        setServices(res.services)
        if (res.services.length > 0) {
          setSelectedServiceId(res.services[0].id)
        }
      }
    }
    loadServices()
  }, [clinicId])

  // Load available slots when service, dentist, or date changes
  useEffect(() => {
    if (!date || !selectedServiceId || !dentistId) return

    async function loadSlots() {
      setIsLoadingSlots(true)
      const res = await getAvailableSlots(clinicId, dentistId!, selectedServiceId!, date)
      setIsLoadingSlots(false)
      if (res.success && res.slots) {
        setSlots(res.slots.filter(s => s.available))
      } else {
        setSlots([])
      }
    }
    loadSlots()
  }, [date, selectedServiceId, dentistId, clinicId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !selectedSlot || !selectedServiceId || !dentistId) {
      alert('Please select date, time slot, and service.')
      return
    }

    const selectedService = services.find(s => s.id === selectedServiceId)
    const slotDuration = selectedService?.slot_duration_min || 30

    // Construct scheduled_at and end_at ISO strings
    const scheduledAtStr = `${date}T${selectedSlot}:00`
    const scheduledAtDate = new Date(scheduledAtStr)
    const endAtDate = new Date(scheduledAtDate.getTime() + slotDuration * 60 * 1000)

    setIsSubmitting(true)
    const res = await createAppointment({
      clinic_id: clinicId,
      patient_id: patientId,
      dentist_id: dentistId!,
      service_id: selectedServiceId!,
      scheduled_at: scheduledAtDate.toISOString(),
      end_at: endAtDate.toISOString(),
      notes: notes || 'Follow-up appointment',
      is_walk_in: false,
    })
    setIsSubmitting(false)

    if (res.success) {
      alert('Follow-up scheduled successfully!')
      setDate('')
      setSelectedSlot(null)
      setNotes('')
      setShowForm(false)
      await onRefresh()
    } else {
      alert(res.error || 'Failed to schedule follow-up')
    }
  }

  // Filter future follow-up appointments (pending/confirmed in the future)
  const now = new Date()
  const followups = appointments.filter(appt => {
    const apptDate = new Date(appt.scheduled_at)
    return (
      apptDate >= now &&
      (appt.status === 'confirmed' || appt.status === 'pending')
    )
  })

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Follow-up Schedule</h4>
          <p className="text-xs text-gray-500 mt-0.5">Plan and review upcoming follow-up appointments.</p>
        </div>
        {dentistId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancel' : 'Schedule Follow-up'}
          </button>
        )}
      </div>

      {/* Booking form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-5 rounded-xl border border-gray-250/60 shadow-xs space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Schedule Follow-up Appointment</span>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-655">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Select Follow-up Service</label>
              <select
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                value={selectedServiceId || ''}
                onChange={e => setSelectedServiceId(parseInt(e.target.value))}
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.slot_duration_min} min)</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Follow-up Date</label>
              <input
                type="date"
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                value={date}
                min={toDateKey()}
                onChange={e => {
                  setDate(e.target.value)
                  setSelectedSlot(null)
                }}
                required
              />
            </div>
          </div>

          {/* Time Slot Picker */}
          {date && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Available Times
              </label>
              {isLoadingSlots ? (
                <p className="text-xs text-slate-500 animate-pulse">Loading time slots...</p>
              ) : slots.length === 0 ? (
                <p className="text-xs text-rose-500 font-medium">No available slots found on this date. Try another day.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {slots.map(s => (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => setSelectedSlot(s.start)}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition ${
                        selectedSlot === s.start
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-slate-700 hover:bg-blue-50/50 hover:border-blue-400'
                      }`}
                    >
                      {s.start}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Appointment Notes / Focus Tooth</label>
            <input
              type="text"
              placeholder="e.g. Post Root Canal Check - Tooth #14"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-slate-600 rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSlot}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Scheduling...' : 'Save Follow-up'}
            </button>
          </div>
        </form>
      )}

      {/* Follow-ups list (matching followups.png) */}
      <div className="space-y-3">
        {followups.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-xl border border-gray-150 shadow-xs">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2.5" />
            <p className="text-xs text-gray-400">No upcoming follow-ups scheduled.</p>
          </div>
        ) : (
          followups.map((appt) => {
            const dentistObj = Array.isArray(appt.dentists) ? appt.dentists[0] : appt.dentists
            const serviceObj = Array.isArray(appt.services) ? appt.services[0] : appt.services
            const dateStr = formatDate(appt.scheduled_at)
            const timeStr = formatTime(appt.scheduled_at)

            return (
              <div
                key={appt.id}
                className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex items-center justify-between hover:shadow-sm transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-slate-800 text-sm">{dateStr}</h5>
                    <p className="text-xs text-slate-600">
                      {serviceObj?.name ?? 'Recall Checkup'} · {timeStr}
                    </p>
                    {appt.notes && (
                      <p className="text-[11px] text-gray-500 mt-1 italic">
                        {appt.notes}
                      </p>
                    )}
                    {dentistObj && (
                      <p className="text-[10px] text-gray-400">
                        Attending: Dr. {dentistObj.first_name} {dentistObj.last_name}
                      </p>
                    )}
                    {(() => {
                      const clinicObj = Array.isArray(appt.clinics) ? appt.clinics[0] : appt.clinics
                      if (!clinicObj) return null
                      return (
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                          Scheduled at {clinicObj.name} {appt.booked_at ? `on ${formatDate(appt.booked_at)}` : ''}
                        </p>
                      )
                    })()}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      appt.status === 'confirmed'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {appt.status === 'confirmed' ? 'scheduled' : 'tentative'}
                  </span>
                </div>
              </div>
            )
          })
        )}

        {/* Sync note */}
        <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 flex items-center gap-3 text-slate-500 font-medium">
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm-6 8c0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z" />
            </svg>
          </div>
          <span className="text-xs text-slate-600 font-semibold leading-snug">
            Follow-up dates are reflected in the dentist, clinic staff, and patient calendar views.
          </span>
        </div>
      </div>
    </div>
  )
}
