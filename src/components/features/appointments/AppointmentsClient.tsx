'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  Calendar,
  User,
  Clock,
  Check,
  X,
  RefreshCw,
  MoreVertical,
  DollarSign,
  AlertCircle,
  FileText
} from 'lucide-react'
import {
  createAppointment,
  updateAppointmentStatus,
  getAvailableSlots,
  AppointmentStatus,
  PaymentMethod
} from '@/actions/appointmentActions'
import { registerPatient } from '@/actions/patientActions'
import { createTransaction } from '@/actions/billingActions'

export interface Patient {
  id: number
  first_name: string
  last_name: string
  phone: string
}

export interface Service {
  id: number
  name: string
  price: number
  slot_duration_min: number
}

export interface Dentist {
  id: number
  first_name: string
  last_name: string
  specialty: string
}

export interface Appointment {
  id: number
  scheduled_at: string
  end_at: string
  status: string
  notes?: string | null
  is_walk_in: boolean
  downpayment: number
  payment_method?: string | null
  payment_status: string
  patients: Patient | null
  services: Service | null
  dentists: Dentist | null
}

interface AppointmentsClientProps {
  clinicId: number
  userId: string
  initialAppointments: Appointment[]
  patients: Patient[]
  services: Service[]
  dentists: Dentist[]
}

export default function AppointmentsClient({
  clinicId,
  userId,
  initialAppointments,
  patients: initialPatients,
  services,
  dentists
}: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [patients, setPatients] = useState<Patient[]>(initialPatients)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState('')

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false)
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null)
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null)
  const [billingAppt, setBillingAppt] = useState<Appointment | null>(null)

  // Booking Form State
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  // New Patient Info
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
  const [selectedSlot, setSelectedSlot] = useState<string>('') // "HH:mm"
  const [notes, setNotes] = useState('')
  const [downpayment, setDownpayment] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [isWalkIn, setIsWalkIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Rescheduling Form State
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleSlots, setRescheduleSlots] = useState<{ start: string; end: string; available: boolean }[]>([])
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState('')

  // Cancel Form State
  const [cancelReason, setCancelReason] = useState('')

  // Billing Form State
  const [discountType, setDiscountType] = useState<'none' | 'senior' | 'pwd' | 'hmo' | 'philhealth'>('none')
  const [hmoCoverage, setHmoCoverage] = useState('0')
  const [philhealthCoverage, setPhilhealthCoverage] = useState('0')
  const [billingPaymentMethod, setBillingPaymentMethod] = useState<'cash' | 'gcash' | 'credit_card' | 'paymaya' | 'hmo'>('cash')

  // Fetch available slots helper
  const handleFetchSlots = async (
    dentistId: number,
    serviceId: number,
    date: string,
    isReschedule = false
  ) => {
    if (!dentistId || !serviceId || !date) return
    const res = await getAvailableSlots(clinicId, dentistId, serviceId, date)
    if (res.success && res.slots) {
      if (isReschedule) {
        setRescheduleSlots(res.slots)
      } else {
        setAvailableSlots(res.slots)
      }
    }
  }

  // Refetch appointments after actions
  const refreshAppointments = async () => {
    const windowLocation = window.location
    windowLocation.reload()
  }

  // Action handlers
  const handleConfirm = async (apptId: number) => {
    if (!confirm('Confirm this appointment?')) return
    const res = await updateAppointmentStatus(apptId, 'confirmed', userId, 'staff', 'Confirmed by staff')
    if (res.success) {
      setAppointments(prev =>
        prev.map(a => (a.id === apptId ? { ...a, status: 'confirmed' } : a))
      )
    }
  }

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancellingAppt) return
    setIsSubmitting(true)
    const res = await updateAppointmentStatus(
      cancellingAppt.id,
      'cancelled',
      userId,
      'staff',
      cancelReason || 'Cancelled by staff'
    )
    setIsSubmitting(false)
    if (res.success) {
      setAppointments(prev =>
        prev.map(a => (a.id === cancellingAppt.id ? { ...a, status: 'cancelled', notes: cancelReason } : a))
      )
      setCancellingAppt(null)
      setCancelReason('')
    } else {
      alert(res.error || 'Failed to cancel appointment')
    }
  }

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reschedulingAppt || !rescheduleDate || !selectedRescheduleSlot) return
    setIsSubmitting(true)

    // Calculate end time based on service duration
    const service = reschedulingAppt.services
    const duration = service?.slot_duration_min || 30
    const startIso = `${rescheduleDate}T${selectedRescheduleSlot}:00`
    const startDateObj = new Date(startIso)
    const endDateObj = new Date(startDateObj.getTime() + duration * 60000)
    const endIso = endDateObj.toISOString()

    const res = await updateAppointmentStatus(
      reschedulingAppt.id,
      'rescheduled',
      userId,
      'staff',
      'Rescheduled by staff',
      startDateObj.toISOString(),
      endIso
    )
    setIsSubmitting(false)
    if (res.success) {
      refreshAppointments()
    } else {
      alert(res.error || 'Failed to reschedule appointment')
    }
  }

  const handleCompleteAndInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!billingAppt || !billingAppt.services || !billingAppt.patients) return
    setIsSubmitting(true)

    // 1. Mark appointment as completed
    const completeRes = await updateAppointmentStatus(
      billingAppt.id,
      'completed',
      userId,
      'staff',
      'Completed and billed'
    )

    if (!completeRes.success) {
      alert('Failed to update appointment to Completed')
      setIsSubmitting(false)
      return
    }

    // 2. Create Transaction Invoice
    const service = billingAppt.services
    const items = [
      {
        service_id: service.id,
        description: `Dental Service: ${service.name}`,
        quantity: 1,
        unit_price: service.price
      }
    ]

    const txRes = await createTransaction({
      appointment_id: billingAppt.id,
      patient_id: billingAppt.patients.id,
      clinic_id: clinicId,
      items,
      discount_type: discountType,
      hmo_coverage: parseFloat(hmoCoverage) || 0,
      philhealth_coverage: parseFloat(philhealthCoverage) || 0,
      payment_method: billingPaymentMethod,
      payment_status: billingPaymentMethod === 'hmo' ? 'partial' : 'paid'
    })

    setIsSubmitting(false)
    if (txRes.success) {
      alert('Appointment completed and invoice created successfully!')
      setBillingAppt(null)
      refreshAppointments()
    } else {
      alert(txRes.error || 'Failed to create transaction invoice')
    }
  }

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      let patientIdObj = selectedPatientId ? parseInt(selectedPatientId) : null

      // If new patient, register first
      if (isNewPatient) {
        if (!newPatientData.firstName || !newPatientData.lastName || !newPatientData.phone || !newPatientData.birthdate) {
          throw new Error('Please fill in all required patient fields')
        }
        const patientRes = await registerPatient({
          first_name: newPatientData.firstName,
          last_name: newPatientData.lastName,
          phone: newPatientData.phone,
          birthdate: newPatientData.birthdate,
          gender: newPatientData.gender,
          address: newPatientData.address,
          is_guest: true,
          clinic_id: clinicId
        })
        if (!patientRes.success || !patientRes.patient) {
          throw new Error(patientRes.error || 'Failed to register patient')
        }
        patientIdObj = patientRes.patient.id
      }

      if (!patientIdObj) throw new Error('Please select or register a patient')
      if (!selectedServiceId) throw new Error('Please select a service')
      if (!selectedDentistId) throw new Error('Please select a dentist')
      if (!bookingDate || !selectedSlot) throw new Error('Please choose a slot')

      const serviceObj = services.find(s => s.id === parseInt(selectedServiceId))
      if (!serviceObj) throw new Error('Selected service not found')

      const startIso = `${bookingDate}T${selectedSlot}:00`
      const startDateObj = new Date(startIso)
      const endDateObj = new Date(startDateObj.getTime() + serviceObj.slot_duration_min * 60000)

      const apptRes = await createAppointment({
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

      if (!apptRes.success) {
        throw new Error(apptRes.error || 'Failed to book appointment')
      }

      setIsBookModalOpen(false)
      // Reset form
      setSelectedPatientId('')
      setSelectedServiceId('')
      setSelectedDentistId('')
      setBookingDate('')
      setSelectedSlot('')
      setNotes('')
      setDownpayment('0')
      setIsNewPatient(false)
      setNewPatientData({ firstName: '', lastName: '', phone: '', birthdate: '', gender: 'male', address: '' })

      refreshAppointments()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter logic
  const filteredAppointments = appointments.filter(appt => {
    const patientName = `${appt.patients?.first_name || ''} ${appt.patients?.last_name || ''}`.toLowerCase()
    const dentistName = `${appt.dentists?.first_name || ''} ${appt.dentists?.last_name || ''}`.toLowerCase()
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) || dentistName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || appt.status === statusFilter
    const matchesDate = !dateFilter || appt.scheduled_at.startsWith(dateFilter)
    return matchesSearch && matchesStatus && matchesDate
  })

  // Format Status Badge
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200'
      case 'rescheduled': return 'bg-purple-50 text-purple-700 border border-purple-200'
      default: return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Tool bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient or dentist..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-Show</option>
          </select>
        </div>
        <button
          onClick={() => setIsBookModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {/* Appointments List / Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Dentist</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Scheduled Date &amp; Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
              {filteredAppointments.map((appt) => {
                const dateObj = new Date(appt.scheduled_at)
                const formattedDate = dateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
                const formattedTime = dateObj.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })

                return (
                  <tr key={appt.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">{appt.patients?.phone || 'No phone'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">
                          Dr. {appt.dentists ? `${appt.dentists.first_name} ${appt.dentists.last_name}` : 'TBD'}
                        </p>
                        <p className="text-xs text-gray-400">{appt.dentists?.specialty || 'General Dentist'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{appt.services?.name ?? '—'}</p>
                        <p className="text-xs text-gray-500">
                          {appt.services ? `₱${appt.services.price.toLocaleString()} · ${appt.services.slot_duration_min} mins` : '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{formattedDate}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formattedTime}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${getStatusBadgeClass(appt.status)}`}>
                        {appt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        appt.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        appt.payment_status === 'partial' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {appt.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => handleConfirm(appt.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Confirm Appointment"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {(appt.status === 'pending' || appt.status === 'confirmed' || appt.status === 'rescheduled') && (
                          <>
                            <button
                              onClick={() => {
                                setReschedulingAppt(appt)
                                setRescheduleDate('')
                                setRescheduleSlots([])
                                setSelectedRescheduleSlot('')
                              }}
                              className="px-2 py-1 text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-xs font-semibold"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => {
                                setBillingAppt(appt)
                                setDiscountType('none')
                                setHmoCoverage('0')
                                setPhilhealthCoverage('0')
                                setBillingPaymentMethod('cash')
                              }}
                              className="px-2 py-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Complete &amp; Bill
                            </button>
                            <button
                              onClick={() => setCancellingAppt(appt)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Cancel Appointment"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-gray-400">
                    <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="font-medium text-slate-500">No appointments found</p>
                    <p className="text-xs text-gray-400 mt-1">Try resetting your search filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Book Appointment */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-900 text-lg">Book Appointment</h3>
              <button onClick={() => setIsBookModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition">
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
                        {p.last_name}, {p.first_name} ({p.phone})
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
                  onClick={() => setIsBookModalOpen(false)}
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
      )}

      {/* MODAL: Reschedule */}
      {reschedulingAppt && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-900 text-lg">Reschedule Appointment</h3>
              <button onClick={() => setReschedulingAppt(null)} className="p-1 hover:bg-gray-200 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-5">
              <div className="bg-blue-50 border border-blue-150 p-3 rounded-lg text-xs text-blue-800 space-y-1">
                <p className="font-bold">Current Appointment Details:</p>
                <p>Patient: {reschedulingAppt.patients ? `${reschedulingAppt.patients.first_name} ${reschedulingAppt.patients.last_name}` : 'Unknown'}</p>
                <p>Service: {reschedulingAppt.services?.name}</p>
                <p>Current Time: {new Date(reschedulingAppt.scheduled_at).toLocaleString('en-US')}</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-805">New Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-550"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value)
                    setSelectedRescheduleSlot('')
                    if (reschedulingAppt.dentists?.id && reschedulingAppt.services?.id) {
                      handleFetchSlots(reschedulingAppt.dentists.id, reschedulingAppt.services.id, e.target.value, true)
                    }
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Available Slots *</label>
                {rescheduleDate && reschedulingAppt.dentists?.id && reschedulingAppt.services?.id ? (
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
                          {slot.start}
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
                  onClick={() => setReschedulingAppt(null)}
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
        </div>
      )}

      {/* MODAL: Cancel */}
      {cancellingAppt && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-900 text-lg">Cancel Appointment</h3>
              <button onClick={() => setCancellingAppt(null)} className="p-1 hover:bg-gray-200 rounded-full transition">
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
                  onClick={() => setCancellingAppt(null)}
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
      )}

      {/* MODAL: Complete & Billing */}
      {billingAppt && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Generate Invoice &amp; Complete
              </h3>
              <button onClick={() => setBillingAppt(null)} className="p-1 hover:bg-gray-200 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCompleteAndInvoice} className="p-6 space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2 text-sm text-slate-700">
                <p><strong>Patient:</strong> {billingAppt.patients ? `${billingAppt.patients.first_name} ${billingAppt.patients.last_name}` : 'Unknown'}</p>
                <p><strong>Treatment / Service:</strong> {billingAppt.services?.name}</p>
                <p className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-slate-900">
                  <span>Service Fee:</span>
                  <span>₱{billingAppt.services?.price.toLocaleString()}</span>
                </p>
                {billingAppt.downpayment > 0 && (
                  <p className="flex justify-between text-xs text-indigo-650 font-medium">
                    <span>Downpayment paid:</span>
                    <span>- ₱{billingAppt.downpayment.toLocaleString()}</span>
                  </p>
                )}
              </div>

              {/* Discount selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Apply Discount</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                  >
                    <option value="none">No Discount</option>
                    <option value="senior">Senior Citizen (20%)</option>
                    <option value="pwd">PWD (20%)</option>
                    <option value="hmo">HMO Coverage</option>
                    <option value="philhealth">PhilHealth Coverage</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-650 block">Payment Method</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                    value={billingPaymentMethod}
                    onChange={e => setBillingPaymentMethod(e.target.value as any)}
                  >
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="paymaya">PayMaya</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="hmo">HMO Billout</option>
                  </select>
                </div>
              </div>

              {discountType === 'hmo' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">HMO Covered Amount (₱)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Enter amount"
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                    value={hmoCoverage}
                    onChange={e => setHmoCoverage(e.target.value)}
                  />
                </div>
              )}

              {discountType === 'philhealth' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">PhilHealth Deductible Amount (₱)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Enter amount"
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                    value={philhealthCoverage}
                    onChange={e => setPhilhealthCoverage(e.target.value)}
                  />
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBillingAppt(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Record Payment &amp; Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
