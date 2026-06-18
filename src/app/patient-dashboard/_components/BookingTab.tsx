'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  MapPin,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createAppointment, getAvailableSlots, updateAppointmentStatus, TimeSlot } from '@/actions/appointmentActions'
import { getBranchData, BranchDentist, BranchService } from '@/actions/bookingActions'
import { PatientRecord } from './types'

interface Branch {
  id: number
  name: string
  address: string
}

interface BookingTabProps {
  branches: Branch[]
  record: PatientRecord
  authUserId: string
  /** @deprecated — will be removed once BookingTab handles branch selection internally */
  clinicId?: number
  dentists?: BranchDentist[]
  services?: BranchService[]
  defaultDownpaymentAmount?: number
}

export function BookingTab({
  branches,
  record,
  authUserId,
}: BookingTabProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlDate = searchParams.get('date') || ''
  const rescheduleMode = searchParams.get('reschedule') === 'true'
  const rescheduleApptId = searchParams.get('apptId') ? parseInt(searchParams.get('apptId')!, 10) : null
  const existingAppt = rescheduleMode && rescheduleApptId
    ? record.appointments.find(a => a.id === rescheduleApptId)
    : null

  // ── Branch selection step ──────────────────────────────────
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
  const [branchLoading, setBranchLoading] = useState(false)
  const [branchError, setBranchError] = useState<string | null>(null)

  // ── Branch-specific data (loaded after branch is selected) ──
  const [dentists, setDentists] = useState<BranchDentist[]>([])
  const [services, setServices] = useState<BranchService[]>([])
  const [defaultDownpaymentAmount, setDefaultDownpaymentAmount] = useState(0)

  // ── Booking form state ─────────────────────────────────────
  const [bookingStatus, setBookingStatus] = useState<{ success?: boolean; error?: string; loading?: boolean }>({})
  const [bookingDentist, setBookingDentist] = useState('')
  const [bookingService, setBookingService] = useState('')
  const [bookingDate, setBookingDate] = useState(urlDate)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [bookingNotes, setBookingNotes] = useState('')
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [paymentType, setPaymentType] = useState<'downpayment' | 'full'>('downpayment')
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'paymaya' | 'credit_card'>('gcash')

  // Load branch data when a branch is selected
  const handleBranchSelect = async (branchId: number) => {
    setBranchLoading(true)
    setBranchError(null)
    setSelectedBranchId(branchId)
    // Reset form fields when branch changes
    setBookingDentist('')
    setBookingService('')
    setBookingDate(urlDate)
    setAvailableTimeSlots([])
    setSelectedTimeSlot(null)

    const result = await getBranchData(branchId)
    if (!result.success) {
      setBranchError(result.error ?? 'Failed to load branch data.')
      setBranchLoading(false)
      return
    }
    setDentists(result.dentists)
    setServices(result.services)
    setDefaultDownpaymentAmount(result.settings.default_downpayment_amount)

    // Auto-select consultation service if only one exists
    const consultations = result.services.filter(s =>
      s.name.toLowerCase().includes('consultation')
    )
    if (consultations.length > 0) {
      setBookingService(String(consultations[0].id))
    }

    setBranchLoading(false)
  }

  // Pre-fill from reschedule mode (use the existing appointment's clinic)
  useEffect(() => {
    if (rescheduleMode && existingAppt) {
      const clinicId = (existingAppt as any).clinic_id
      if (clinicId) handleBranchSelect(clinicId)

      const dId = String(existingAppt.dentists?.id || '')
      const sId = String(existingAppt.services?.id || '')
      setBookingDentist(dId)
      setBookingService(sId)
      if (existingAppt.scheduled_at) {
        const datePart = new Date(existingAppt.scheduled_at).toISOString().slice(0, 10)
        setBookingDate(datePart)
      }
    }
  }, [rescheduleMode])

  // Fetch slots when dentist/service/date/branch all set
  const fetchSlots = async (dateVal: string, dentistVal: string, serviceVal: string) => {
    if (!dateVal || !dentistVal || !serviceVal || !selectedBranchId) return
    setSlotsLoading(true)
    setSelectedTimeSlot(null)
    try {
      const res = await getAvailableSlots(selectedBranchId, parseInt(dentistVal, 10), parseInt(serviceVal, 10), dateVal)
      setAvailableTimeSlots(res.success && res.slots ? res.slots : [])
    } catch (e) {
      console.error(e)
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBranchId || !bookingDentist || !bookingService || !bookingDate || !selectedTimeSlot) {
      setBookingStatus({ error: 'Please fill out all fields and select a time slot.' })
      return
    }

    setBookingStatus({ loading: true })

    const scheduledAtStr = `${bookingDate}T${selectedTimeSlot.start}:00`
    const endAtStr = `${bookingDate}T${selectedTimeSlot.end}:00`

    if (rescheduleMode && rescheduleApptId) {
      try {
        const res = await updateAppointmentStatus(
          rescheduleApptId,
          'rescheduled',
          authUserId,
          'patient',
          'Rescheduled by patient',
          new Date(scheduledAtStr).toISOString(),
          new Date(endAtStr).toISOString()
        )
        if (res.success) {
          setBookingStatus({ success: true })
          setTimeout(() => router.push('/patient-dashboard/appointments'), 1500)
        } else {
          setBookingStatus({ error: res.error || 'Failed to reschedule appointment.' })
        }
      } catch {
        setBookingStatus({ error: 'An unexpected error occurred.' })
      }
      return
    }

    const selectedServiceObj = services.find(s => s.id === parseInt(bookingService, 10))
    if (!selectedServiceObj) return

    const servicePrice = selectedServiceObj.price
    const downpaymentAmount = Math.min(defaultDownpaymentAmount, servicePrice) || servicePrice
    const finalDownpayment = paymentType === 'full' ? servicePrice : downpaymentAmount

    try {
      const res = await createAppointment({
        clinic_id: selectedBranchId,
        patient_id: record.patient.id,
        dentist_id: parseInt(bookingDentist, 10),
        service_id: parseInt(bookingService, 10),
        scheduled_at: new Date(scheduledAtStr).toISOString(),
        end_at: new Date(endAtStr).toISOString(),
        notes: bookingNotes,
        downpayment: finalDownpayment,
        payment_method: paymentMethod,
      })

      if (res.success) {
        setBookingStatus({ success: true })
        setBookingDentist('')
        setBookingService('')
        setBookingDate('')
        setAvailableTimeSlots([])
        setSelectedTimeSlot(null)
        setBookingNotes('')
        setTimeout(() => router.push('/patient-dashboard/appointments'), 1500)
      } else {
        setBookingStatus({ error: res.error || 'Failed to schedule appointment.' })
      }
    } catch {
      setBookingStatus({ error: 'An unexpected error occurred.' })
    }
  }

  const consultationServices = services.filter(s =>
    s.name.toLowerCase().includes('consultation')
  )
  const selectedBranch = branches.find(b => b.id === selectedBranchId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Schedule Appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ── Step 1: Branch selection ───────────────────────── */}
        <div>
          <p className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
            Step 1 — Choose a Branch
          </p>
          {branches.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No active branches available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {branches.map(branch => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleBranchSelect(branch.id)}
                  disabled={branchLoading && selectedBranchId === branch.id}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150',
                    selectedBranchId === branch.id
                      ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-500 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  )}
                >
                  <MapPin className={cn(
                    'w-4 h-4 mt-0.5 shrink-0',
                    selectedBranchId === branch.id ? 'text-blue-600' : 'text-slate-400'
                  )} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm leading-tight">{branch.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight truncate">{branch.address}</p>
                  </div>
                  {selectedBranchId === branch.id && (
                    branchLoading
                      ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-auto shrink-0" />
                      : <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
          {branchError && (
            <p className="text-xs text-red-600 mt-2 font-semibold">{branchError}</p>
          )}
        </div>

        {/* ── Step 2: Booking form (shown after branch is loaded) ── */}
        {selectedBranchId && !branchLoading && (
          <>
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider flex items-center gap-1.5">
                Step 2 — Book at
                <span className="text-blue-600 normal-case font-bold">{selectedBranch?.name}</span>
                <button
                  type="button"
                  onClick={() => { setSelectedBranchId(null); setDentists([]); setServices([]) }}
                  className="ml-auto text-xs text-slate-400 hover:text-slate-600 font-medium normal-case"
                >
                  Change branch
                </button>
              </p>

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
                  {/* Service */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Service</label>
                    {consultationServices.length === 0 ? (
                      <div className="w-full border border-red-200 text-red-600 rounded-lg p-2.5 bg-red-50 text-sm font-semibold">
                        No consultation services available at this branch.
                      </div>
                    ) : consultationServices.length === 1 ? (
                      <div className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-semibold text-slate-700 flex items-center justify-between">
                        <span>{consultationServices[0].name}</span>
                        <span className="text-xs text-blue-600 font-bold">PHP {consultationServices[0].price.toLocaleString()}</span>
                      </div>
                    ) : (
                      <select
                        value={bookingService}
                        onChange={(e) => {
                          setBookingService(e.target.value)
                          fetchSlots(bookingDate, bookingDentist, e.target.value)
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 disabled:opacity-75 disabled:bg-slate-50"
                        required
                        disabled={rescheduleMode}
                      >
                        {consultationServices.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} (PHP {s.price.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Dentist */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Select Dentist</label>
                    <select
                      value={bookingDentist}
                      onChange={(e) => {
                        setBookingDentist(e.target.value)
                        fetchSlots(bookingDate, e.target.value, bookingService)
                      }}
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Choose Dentist --</option>
                      {dentists.map(d => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.first_name} {d.last_name}{d.specialty ? ` (${d.specialty})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Select Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setBookingDate(e.target.value)
                      fetchSlots(e.target.value, bookingDentist, bookingService)
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Time slots */}
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
                              'p-2 text-xs font-bold rounded-lg border text-center transition-all',
                              !slot.available
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                : selectedTimeSlot?.start === slot.start
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-500'
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

                {/* Payment options */}
                {!rescheduleMode && bookingService && (() => {
                  const activeService = services.find(s => s.id === parseInt(bookingService, 10))
                  if (!activeService) return null
                  const servicePrice = activeService.price
                  const downpaymentAmount = Math.min(defaultDownpaymentAmount, servicePrice) || servicePrice

                  return (
                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <label className="block text-xs font-bold uppercase text-slate-500">
                        Choose Payment Option
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentType('downpayment')}
                          className={cn(
                            'p-4 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between h-24 relative overflow-hidden cursor-pointer',
                            paymentType === 'downpayment'
                              ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-500'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/30'
                          )}
                        >
                          <div>
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Downpayment</span>
                            <span className="block text-xl font-black text-slate-900 mt-1">₱{downpaymentAmount.toLocaleString()}</span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">Pay partial amount to reserve slot</span>
                          {paymentType === 'downpayment' && (
                            <div className="absolute right-2.5 top-2.5 bg-blue-600 text-white rounded-full p-0.5">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentType('full')}
                          className={cn(
                            'p-4 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between h-24 relative overflow-hidden cursor-pointer',
                            paymentType === 'full'
                              ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-500'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/30'
                          )}
                        >
                          <div>
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Full Payment</span>
                            <span className="block text-xl font-black text-slate-900 mt-1">₱{servicePrice.toLocaleString()}</span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">Pay full price of consultation</span>
                          {paymentType === 'full' && (
                            <div className="absolute right-2.5 top-2.5 bg-blue-600 text-white rounded-full p-0.5">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </button>
                      </div>

                      <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <label className="block text-xs font-bold uppercase text-slate-500">
                          Select Payment Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 text-sm cursor-pointer"
                        >
                          <option value="gcash">GCash</option>
                          <option value="paymaya">Maya</option>
                          <option value="credit_card">Card</option>
                        </select>
                      </div>
                    </div>
                  )
                })()}

                {/* Notes */}
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
                  {bookingStatus.loading
                    ? (rescheduleMode ? 'Updating...' : 'Booking...')
                    : (rescheduleMode ? 'Reschedule Appointment' : 'Book Appointment')}
                </Button>
              </form>
            </div>
          </>
        )}

        {/* Loading skeleton while branch data loads */}
        {selectedBranchId && branchLoading && (
          <div className="border-t border-slate-100 pt-5 space-y-3 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-slate-100 rounded-lg" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-10 bg-slate-100 rounded-lg" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
