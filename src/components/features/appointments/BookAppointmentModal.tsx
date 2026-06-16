'use client'

import { useState } from 'react'
import { X, AlertCircle, RefreshCw } from 'lucide-react'
import {
  createAppointment,
  getAvailableSlots,
  PaymentMethod
} from '@/actions/appointmentActions'
import { registerPatient } from '@/actions/patientActions'
import type { Patient, Service, Dentist } from './AppointmentTypes'
import { formatPhone } from '@/utils/phone-helpers'

const MILLISECONDS_PER_MINUTE = 60_000

interface BookAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  patients: Patient[]
  services: Service[]
  dentists: Dentist[]
  clinicId: number
  onSuccess: () => void
}

export default function BookAppointmentModal({
  isOpen,
  onClose,
  patients,
  services,
  dentists,
  clinicId,
  onSuccess
}: BookAppointmentModalProps) {
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthdate: '',
    gender: 'male',
    address: ''
  })
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [selectedDentistId, setSelectedDentistId] = useState<string>('')
  const [bookingDate, setBookingDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string; available: boolean }[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [downpayment, setDownpayment] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [isWalkIn, setIsWalkIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleFetchSlots = async (dentistId: number, serviceId: number, date: string) => {
    if (!dentistId || !serviceId || !date) return
    const slotsResult = await getAvailableSlots(clinicId, dentistId, serviceId, date)
    if (slotsResult.success && slotsResult.slots) {
      setAvailableSlots(slotsResult.slots)
    }
  }

  const resetForm = () => {
    setSelectedPatientId('')
    setSelectedServiceId('')
    setSelectedDentistId('')
    setBookingDate('')
    setSelectedSlot('')
    setNotes('')
    setDownpayment('0')
    setIsNewPatient(false)
    setNewPatientData({ firstName: '', lastName: '', phone: '', birthdate: '', gender: 'male', address: '' })
    setAvailableSlots([])
    setFormError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!isNewPatient && !selectedPatientId) {
      setFormError('Please select or register a patient')
      return
    }
    if (!selectedServiceId) {
      setFormError('Please select a service')
      return
    }
    if (!selectedDentistId) {
      setFormError('Please select a dentist')
      return
    }
    if (!bookingDate || !selectedSlot) {
      setFormError('Please choose a slot')
      return
    }

    setIsSubmitting(true)

    try {
      let patientIdObj = selectedPatientId ? parseInt(selectedPatientId) : null

      if (isNewPatient) {
        if (!newPatientData.firstName || !newPatientData.lastName || !newPatientData.phone || !newPatientData.birthdate) {
          throw new Error('Please fill in all required patient fields')
        }
        const registrationResult = await registerPatient({
          first_name: newPatientData.firstName,
          last_name: newPatientData.lastName,
          phone: newPatientData.phone,
          birthdate: newPatientData.birthdate,
          gender: newPatientData.gender,
          address: newPatientData.address,
          is_guest: true,
          clinic_id: clinicId
        })
        if (!registrationResult.success || !registrationResult.patient) {
          throw new Error(registrationResult.error || 'Failed to register patient')
        }
        patientIdObj = registrationResult.patient.id
      }

      if (!patientIdObj) throw new Error('Please select or register a patient')

      const serviceObj = services.find(s => s.id === parseInt(selectedServiceId))
      if (!serviceObj) throw new Error('Selected service not found')

      const startIso = `${bookingDate}T${selectedSlot}:00`
      const startDateObj = new Date(startIso)
      const endDateObj = new Date(startDateObj.getTime() + serviceObj.slot_duration_min * MILLISECONDS_PER_MINUTE)

      const bookingResult = await createAppointment({
        clinic_id: clinicId,
        patient_id: patientIdObj,
        dentist_id: parseInt(selectedDentistId),
        service_id: parseInt(selectedServiceId),
        scheduled_at: startDateObj.toISOString(),
        end_at: endDateObj.toISOString(),
        notes: notes,
        is_walk_in: isWalkIn,
        downpayment: parseFloat(downpayment) || 0,
        payment_method: downpayment && parseFloat(downpayment) > 0 ? paymentMethod : undefined
      })

      if (!bookingResult.success) {
        throw new Error(bookingResult.error || 'Failed to book appointment')
      }

      resetForm()
      onClose()
      onSuccess()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-lg">Book Appointment</h3>
          <button onClick={handleClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleBookSubmit} className="p-6 space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Patient Selection Option */}
          <div className="space-y-3">
            <div className="flex gap-4 items-center">
              <label className="text-sm font-semibold text-slate-800">Patient Details</label>
              <button
                type="button"
                onClick={() => setIsNewPatient(!isNewPatient)}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold transition underline"
              >
                {isNewPatient ? 'Select Existing Patient' : 'Register New Walk-in Patient'}
              </button>
            </div>

            {!isNewPatient ? (
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">-- Select Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.last_name}, {p.first_name} ({formatPhone(p.phone)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">First Name *</span>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                    value={newPatientData.firstName}
                    onChange={e => setNewPatientData({ ...newPatientData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Last Name *</span>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                    value={newPatientData.lastName}
                    onChange={e => setNewPatientData({ ...newPatientData, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Phone Number *</span>
                  <input
                    type="tel"
                    required
                    placeholder="09XXXXXXXXX"
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                    value={newPatientData.phone}
                    onChange={e => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Birthdate *</span>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                    value={newPatientData.birthdate}
                    onChange={e => setNewPatientData({ ...newPatientData, birthdate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Gender *</span>
                  <select
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                    value={newPatientData.gender}
                    onChange={e => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-xs font-medium text-slate-600">Address</span>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                    value={newPatientData.address}
                    onChange={e => setNewPatientData({ ...newPatientData, address: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Service & Dentist selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">Select Service *</label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500"
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value)
                  setSelectedSlot('')
                  if (selectedDentistId && bookingDate) {
                    handleFetchSlots(parseInt(selectedDentistId), parseInt(e.target.value), bookingDate)
                  }
                }}
              >
                <option value="">-- Choose Service --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (₱{s.price} · {s.slot_duration_min} min)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">Assign Dentist *</label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500"
                value={selectedDentistId}
                onChange={(e) => {
                  setSelectedDentistId(e.target.value)
                  setSelectedSlot('')
                  if (selectedServiceId && bookingDate) {
                    handleFetchSlots(parseInt(e.target.value), parseInt(selectedServiceId), bookingDate)
                  }
                }}
              >
                <option value="">-- Choose Dentist --</option>
                {dentists.map(d => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.first_name} {d.last_name} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Slots Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">Booking Date *</label>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500"
                value={bookingDate}
                onChange={(e) => {
                  setBookingDate(e.target.value)
                  setSelectedSlot('')
                  if (selectedDentistId && selectedServiceId) {
                    handleFetchSlots(parseInt(selectedDentistId), parseInt(selectedServiceId), e.target.value)
                  }
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">Available Slots *</label>
              {bookingDate && selectedDentistId && selectedServiceId ? (
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
                        {slot.start}
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
                  Select dentist, service and date to view slots.
                </p>
              )}
            </div>
          </div>

          {/* Type, Downpayment and notes */}
          <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-800 block">Booking Type</span>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 focus:ring-blue-550 w-4 h-4"
                  checked={isWalkIn}
                  onChange={e => setIsWalkIn(e.target.checked)}
                />
                Walk-in Appointment
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 block">Downpayment Details</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  className="w-24 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                  value={downpayment}
                  onChange={e => setDownpayment(e.target.value)}
                />
                {parseFloat(downpayment) > 0 && (
                  <select
                    className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="paymaya">PayMaya</option>
                    <option value="credit_card">Card</option>
                  </select>
                )}
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-sm font-semibold text-slate-800">Notes / Comments</label>
              <textarea
                placeholder="Optional clinic notes or patient concerns..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-550 h-20 resize-none"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
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
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
