'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, RefreshCw } from 'lucide-react'
import { registerWalkInPatientAndBook } from '@/actions/patientCoreActions'
import { useAvailableSlots, MILLISECONDS_PER_MINUTE } from './hooks/useAvailableSlots'
import { toDateKey, formatTo12h } from '@/lib/date'
import type { Dentist } from './AppointmentTypes'

const DEFAULT_DURATION_MIN = 60

interface WalkInModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clinicId: number
  dentists: Dentist[]
}

export default function WalkInModal({
  isOpen,
  onClose,
  onSuccess,
  clinicId,
  dentists,
}: WalkInModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [address, setAddress] = useState('')
  const [dentistId, setDentistId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [mounted, setMounted] = useState(false)

  const { slots: availableSlots, fetchSlots, clearSlots } = useAvailableSlots(clinicId)

  useEffect(() => { setMounted(true) }, [])

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setPhone('')
    setGender('')
    setBirthdate('')
    setAddress('')
    setDentistId('')
    setBookingDate('')
    setSelectedSlot('')
    setNotes('')
    setFormError('')
    clearSlots()
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setFormError('First name, last name, and phone are required.')
      return
    }
    if (!dentistId) {
      setFormError('Please select a dentist.')
      return
    }
    if (!bookingDate || !selectedSlot) {
      setFormError('Please choose a date and an available slot.')
      return
    }

    setIsSubmitting(true)
    try {
      const startIso = `${bookingDate}T${selectedSlot}:00`
      const endIso = new Date(
        new Date(startIso).getTime() + DEFAULT_DURATION_MIN * MILLISECONDS_PER_MINUTE
      ).toISOString()

      const result = await registerWalkInPatientAndBook({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        gender: gender || undefined,
        birthdate: birthdate || undefined,
        address: address.trim() || undefined,
        clinic_id: clinicId,
        dentist_id: parseInt(dentistId),
        scheduled_at: new Date(startIso).toISOString(),
        end_at: endIso,
        notes: notes.trim() || undefined,
      })

      if (!result.success) throw new Error(result.error ?? 'Failed to book walk-in appointment.')

      resetForm()
      onClose()
      onSuccess()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-lg">Walk-in Appointment</h3>
          <button onClick={handleClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Patient info */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-800">Patient Details</label>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-600">First Name *</span>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Last Name *</span>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-xs font-medium text-slate-600">Phone Number *</span>
                <input
                  type="tel"
                  required
                  placeholder="09XXXXXXXXX"
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Gender</span>
                <select
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                >
                  <option value="">-- Select --</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Birthdate</span>
                <input
                  type="date"
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={birthdate}
                  onChange={e => setBirthdate(e.target.value)}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-xs font-medium text-slate-600">Address</span>
                <input
                  type="text"
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dentist */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800">Assign Dentist *</label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500"
              value={dentistId}
              onChange={e => {
                setDentistId(e.target.value)
                setSelectedSlot('')
                if (bookingDate) fetchSlots(parseInt(e.target.value), null, bookingDate)
              }}
            >
              <option value="">-- Choose Dentist --</option>
              {dentists.map(d => (
                <option key={d.id} value={d.id}>
                  Dr. {d.first_name} {d.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Slots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">Booking Date *</label>
              <input
                type="date"
                required
                min={toDateKey()}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500"
                value={bookingDate}
                onChange={e => {
                  setBookingDate(e.target.value)
                  setSelectedSlot('')
                  if (dentistId) fetchSlots(parseInt(dentistId), null, e.target.value)
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">Available Slots *</label>
              {bookingDate && dentistId ? (
                availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-100 p-2 rounded-lg bg-gray-50">
                    {availableSlots.map(slot => (
                      <button
                        key={slot.start}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.start)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition ${
                          selectedSlot === slot.start
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
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1 bg-red-50 p-2 rounded-lg border border-red-100">
                    <AlertCircle className="w-3.5 h-3.5" /> No available slots on this day.
                  </p>
                )
              ) : (
                <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-center">
                  Select dentist and date to view slots.
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-gray-100 pt-4 space-y-1">
            <label className="text-sm font-semibold text-slate-800">Notes / Comments</label>
            <textarea
              placeholder="Optional clinic notes or patient concerns..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Walk-in'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
