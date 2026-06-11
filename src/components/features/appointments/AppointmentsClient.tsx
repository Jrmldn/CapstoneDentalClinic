'use client'

import { useState } from 'react'
import { Search, Plus, Calendar } from 'lucide-react'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import type {
  Patient,
  Service,
  Dentist,
  Appointment,
  AppointmentsClientProps
} from './AppointmentTypes'
import AppointmentTable from './AppointmentTable'
import BookAppointmentModal from './BookAppointmentModal'
import RescheduleModal from './RescheduleModal'
import CancelModal from './CancelModal'
import AppointmentBillingModal from './AppointmentBillingModal'

export default function AppointmentsClient({
  clinicId,
  userId,
  initialAppointments,
  patients,
  services,
  dentists
}: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState(() => {
    const localDate = new Date()
    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false)
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null)
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null)
  const [billingAppt, setBillingAppt] = useState<Appointment | null>(null)

  // Refetch appointments after actions
  const refreshAppointments = () => {
    window.location.reload()
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

  const handleCancelSuccess = (apptId: number, reason: string) => {
    setAppointments(prev =>
      prev.map(a =>
        a.id === apptId ? { ...a, status: 'cancelled', notes: reason } : a
      )
    )
    setCancellingAppt(null)
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
      <AppointmentTable
        filteredAppointments={filteredAppointments}
        onConfirm={handleConfirm}
        onReschedule={setReschedulingAppt}
        onOpenBilling={setBillingAppt}
        onCancel={setCancellingAppt}
      />

      {/* MODAL: Book Appointment */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        patients={patients}
        services={services}
        dentists={dentists}
        clinicId={clinicId}
        onSuccess={refreshAppointments}
      />

      {/* MODAL: Reschedule */}
      <RescheduleModal
        appointment={reschedulingAppt}
        onClose={() => setReschedulingAppt(null)}
        userId={userId}
        clinicId={clinicId}
        onSuccess={refreshAppointments}
      />

      {/* MODAL: Cancel */}
      <CancelModal
        appointment={cancellingAppt}
        onClose={() => setCancellingAppt(null)}
        userId={userId}
        onSuccess={handleCancelSuccess}
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
