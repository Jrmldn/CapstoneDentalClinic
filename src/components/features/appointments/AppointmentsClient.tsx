'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, Calendar, UserPlus } from 'lucide-react'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import type {
  Appointment,
  AppointmentsClientProps
} from './AppointmentTypes'
import AppointmentTable from './AppointmentTable'
import BookAppointmentModal from './BookAppointmentModal'
import WalkInModal from './WalkInModal'
import RescheduleModal from './RescheduleModal'
import AppointmentBillingModal from './AppointmentBillingModal'

export default function AppointmentsClient({
  clinicId,
  userId,
  initialAppointments,
  patients,
  services,
  dentists
}: AppointmentsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState(() => {
    const localDate = new Date()
    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false)
  const [preSelectedPatientId, setPreSelectedPatientId] = useState<number | null>(null)
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null)
  const [billingAppt, setBillingAppt] = useState<Appointment | null>(null)

  // Open Book modal with pre-selected patient when navigating from Patient Directory
  useEffect(() => {
    const bookForPatient = searchParams.get('bookForPatient')
    if (bookForPatient) {
      const patientId = parseInt(bookForPatient)
      if (!isNaN(patientId)) {
        setPreSelectedPatientId(patientId)
        setIsBookModalOpen(true)
        router.replace('/staff-dashboard/appointments')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshAppointments = () => {
    router.refresh()
  }

  // Action handlers
  const handleConfirm = async (apptId: number) => {
    if (!confirm('Confirm this appointment?')) return
    const confirmResult = await updateAppointmentStatus(
      apptId,
      'confirmed',
      userId,
      'staff',
      'Confirmed by staff'
    )
    if (confirmResult.success) {
      setAppointments(prev =>
        prev.map(a => (a.id === apptId ? { ...a, status: 'confirmed' } : a))
      )
    }
  }

  const handleCancel = async (apptId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    const res = await updateAppointmentStatus(
      apptId,
      'cancelled',
      userId,
      'staff',
      'Cancelled by staff'
    )
    if (res.success) {
      setAppointments(prev =>
        prev.map(a => (a.id === apptId ? { ...a, status: 'cancelled' } : a))
      )
    } else {
      alert(res.error || 'Failed to cancel appointment.')
    }
  }

  const handleNoShow = async (apptId: number) => {
    if (!confirm('Mark this appointment as No-Show?')) return
    const res = await updateAppointmentStatus(apptId, 'no_show', userId, 'staff', 'Patient did not show up')
    if (res.success) {
      setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, status: 'no_show' } : a)))
    } else {
      alert(res.error || 'Failed to mark as no-show.')
    }
  }

  // Filter logic
  const filteredAppointments = appointments.filter(appt => {
    // Hide unpaid online bookings until downpayment is confirmed
    if (appt.payment_status === 'unpaid' && !appt.is_walk_in) return false
    const patientName = `${appt.patients?.first_name || ''} ${appt.patients?.last_name || ''}`.toLowerCase()
    const dentistName = `${appt.dentists?.first_name || ''} ${appt.dentists?.last_name || ''}`.toLowerCase()
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) || dentistName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || appt.status === statusFilter
    let matchesDate = true
    if (dateFilter) {
      const d = new Date(appt.scheduled_at)
      const apptDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      matchesDate = apptDateStr === dateFilter
    }
    const matchesType = typeFilter === 'all' ||
      (typeFilter === 'walk_in' && appt.is_walk_in) ||
      (typeFilter === 'online' && !appt.is_walk_in)
    return matchesSearch && matchesStatus && matchesDate && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Tool bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
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
            <option value="pending_patient_confirm">Pending Patient Confirm</option>
            <option value="confirmed">Confirmed</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="follow_up">Follow Up</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-Show</option>
          </select>
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Booking Types</option>
            <option value="walk_in">Walk-In</option>
            <option value="online">Online Booking</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition shadow-sm font-medium text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Walk-in
          </button>
          <button
            onClick={() => { setPreSelectedPatientId(null); setIsBookModalOpen(true) }}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Book Appointment
          </button>
        </div>
      </div>

      {/* Appointments List / Table */}
      <AppointmentTable
        filteredAppointments={filteredAppointments}
        onConfirm={handleConfirm}
        onReschedule={setReschedulingAppt}
        onOpenBilling={setBillingAppt}
        onNoShow={handleNoShow}
        onCancel={handleCancel}
      />

      {/* MODAL: Book Appointment */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => { setIsBookModalOpen(false); setPreSelectedPatientId(null) }}
        patients={patients}
        services={services}
        dentists={dentists}
        clinicId={clinicId}
        onSuccess={refreshAppointments}
        initialPatientId={preSelectedPatientId ?? undefined}
      />

      {/* MODAL: Walk-in Appointment */}
      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSuccess={refreshAppointments}
        clinicId={clinicId}
        services={services}
        dentists={dentists}
      />

      {/* MODAL: Reschedule */}
      <RescheduleModal
        appointment={reschedulingAppt}
        onClose={() => setReschedulingAppt(null)}
        userId={userId}
        clinicId={clinicId}
        onSuccess={() => {
          setReschedulingAppt(null)
          refreshAppointments()
        }}
      />

      {/* MODAL: Complete & Billing */}
      <AppointmentBillingModal
        appointment={billingAppt}
        onClose={() => setBillingAppt(null)}
        userId={userId}
        clinicId={clinicId}
        onSuccess={refreshAppointments}
      />
    </div>
  )
}
