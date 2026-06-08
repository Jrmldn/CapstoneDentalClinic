'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createAppointment, getAvailableSlots, TimeSlot } from '@/actions/appointmentActions'
import { Dentist, Service, PatientRecord } from './types'

interface BookingTabProps {
  clinicId: number
  record: PatientRecord
  dentists: Dentist[]
  services: Service[]
}

export function BookingTab({
  clinicId,
  record,
  dentists,
  services,
}: BookingTabProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlDate = searchParams.get('date') || ''

  const [bookingStatus, setBookingStatus] = useState<{ success?: boolean; error?: string; loading?: boolean }>({})
  const [bookingDentist, setBookingDentist] = useState<string>('')
  const [bookingService, setBookingService] = useState<string>('')
  const [bookingDate, setBookingDate] = useState<string>(urlDate)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [bookingNotes, setBookingNotes] = useState<string>('')
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Triggered when clinicId, dentist, service, or date changes
  const handleDateOrDentistChange = async (dateVal: string, dentistVal: string, serviceVal: string) => {
    if (!dateVal || !dentistVal || !serviceVal) return
    setSlotsLoading(true)
    setSelectedTimeSlot(null)
    try {
      const res = await getAvailableSlots(clinicId, parseInt(dentistVal, 10), parseInt(serviceVal, 10), dateVal)
      if (res.success && res.slots) {
        setAvailableTimeSlots(res.slots)
      } else {
        setAvailableTimeSlots([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSlotsLoading(false)
    }
  }

  // Handle shortcut date selection from the calendar tab URL query parameter
  useEffect(() => {
    if (urlDate) {
      setBookingDate(urlDate)
      // If dentist and service are already selected, fetch slots
      if (bookingDentist && bookingService) {
        handleDateOrDentistChange(urlDate, bookingDentist, bookingService)
      }
    }
  }, [urlDate])

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingDentist || !bookingService || !bookingDate || !selectedTimeSlot) {
      setBookingStatus({ error: 'Please fill out all fields and select a slot.' })
      return
    }

    setBookingStatus({ loading: true })
    const selectedServiceObj = services.find(s => s.id === parseInt(bookingService, 10))
    if (!selectedServiceObj) return

    // Convert date + HH:mm to ISO strings
    const scheduledAtStr = `${bookingDate}T${selectedTimeSlot.start}:00`
    const endAtStr = `${bookingDate}T${selectedTimeSlot.end}:00`

    try {
      const res = await createAppointment({
        clinic_id: clinicId,
        patient_id: record.patient.id,
        dentist_id: parseInt(bookingDentist, 10),
        service_id: parseInt(bookingService, 10),
        scheduled_at: new Date(scheduledAtStr).toISOString(),
        end_at: new Date(endAtStr).toISOString(),
        notes: bookingNotes
      })

      if (res.success) {
        setBookingStatus({ success: true })
        // Clear form
        setBookingDentist('')
        setBookingService('')
        setBookingDate('')
        setAvailableTimeSlots([])
        setSelectedTimeSlot(null)
        setBookingNotes('')
        
        // Remove date parameters from url if any and redirect
        setTimeout(() => {
          router.replace('/patient-dashboard/booking')
          router.push('/patient-dashboard/appointments')
          router.refresh()
          setBookingStatus({})
        }, 1500)
      } else {
        setBookingStatus({ error: res.error || 'Failed to schedule appointment.' })
      }
    } catch (err) {
      setBookingStatus({ error: 'An unexpected error occurred.' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Schedule Appointment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          {bookingStatus.error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              {bookingStatus.error}
            </div>
          )}
          {bookingStatus.success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Appointment booked successfully! Redirecting...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Select Service</label>
              <select
                value={bookingService}
                onChange={(e) => {
                  setBookingService(e.target.value)
                  handleDateOrDentistChange(bookingDate, bookingDentist, e.target.value)
                }}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose Service --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (PHP {s.price})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Select Dentist</label>
              <select
                value={bookingDentist}
                onChange={(e) => {
                  setBookingDentist(e.target.value)
                  handleDateOrDentistChange(bookingDate, e.target.value, bookingService)
                }}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose Dentist --</option>
                {dentists.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} {d.specialty ? `(${d.specialty})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Select Date</label>
            <input
              type="date"
              value={bookingDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setBookingDate(e.target.value)
                handleDateOrDentistChange(e.target.value, bookingDentist, bookingService)
              }}
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {bookingDate && bookingDentist && bookingService && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Choose Available Time Slot
              </label>
              {slotsLoading ? (
                <p className="text-sm text-slate-500 animate-pulse">Checking slot availability...</p>
              ) : availableTimeSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableTimeSlots.map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={cn(
                        "p-2 text-xs font-bold rounded-lg border text-center transition-all",
                        !slot.available
                          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          : selectedTimeSlot?.start === slot.start
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-500"
                      )}
                    >
                      {slot.start}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  No slots available for this dentist on this date.
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Notes (Optional)</label>
            <textarea
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="Add any information, symptoms, or preferences here..."
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
            disabled={bookingStatus.loading || !selectedTimeSlot}
          >
            {bookingStatus.loading ? 'Booking...' : 'Book Appointment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
