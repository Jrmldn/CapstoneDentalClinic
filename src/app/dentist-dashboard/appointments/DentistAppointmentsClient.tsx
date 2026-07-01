'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Calendar, ClipboardList } from 'lucide-react'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import { formatDate, formatTime, toDateKey } from '@/lib/date'
import DentistChartBillingModal from '@/components/features/appointments/DentistChartBillingModal'
import type { Appointment } from '@/components/features/dashboard/DentistDashboardView'
import type { Service } from '@/components/features/billing/types'
import type { InventoryItem } from '@/components/features/inventory/types'

interface Props {
  appointments: Appointment[]
  clinicId: number
  dentistUserId: string
  dentistId: number
  dentistName: string
  branchName: string
  services: Service[]
  inventoryItems: InventoryItem[]
}

const STATUS_STYLES: Record<string, string> = {
  pending:                 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed:               'bg-emerald-50 text-emerald-700 border border-emerald-200',
  completed:               'bg-slate-50 text-slate-600 border border-slate-200',
  rescheduled:             'bg-blue-50 text-blue-700 border border-blue-200',
  cancelled:               'bg-red-50 text-red-700 border border-red-200',
  no_show:                 'bg-orange-50 text-orange-700 border border-orange-200',
  follow_up:               'bg-teal-50 text-teal-700 border border-teal-200',
  pending_patient_confirm: 'bg-purple-50 text-purple-700 border border-purple-200',
}

function isPastOrToday(scheduledAt: string): boolean {
  return toDateKey(scheduledAt) <= toDateKey()
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default function DentistAppointmentsClient({ appointments, clinicId, dentistUserId, dentistId, dentistName, branchName, services, inventoryItems }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [completingAppt, setCompletingAppt] = useState<Appointment | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const filtered = appointments.filter(appt => {
    const name = `${appt.patients?.first_name ?? ''} ${appt.patients?.last_name ?? ''}`.toLowerCase()
    const matchesSearch = name.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || appt.status === statusFilter
    let matchesDate = true
    if (dateFilter) {
      const d = new Date(appt.scheduled_at)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      matchesDate = dateStr === dateFilter
    }
    return matchesSearch && matchesStatus && matchesDate
  })

  const handleStatusUpdate = async (apptId: number, status: 'confirmed' | 'no_show' | 'cancelled') => {
    setUpdatingId(apptId)
    const res = await updateAppointmentStatus(apptId, status, dentistUserId, 'dentist')
    setUpdatingId(null)
    if (res.success) {
      startTransition(() => router.refresh())
    }
  }

  const canCancel = (status: string) =>
    status === 'pending' || status === 'confirmed' || status === 'rescheduled' || status === 'pending_patient_confirm'

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient name..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending_patient_confirm">Pending Patient Confirm</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="follow_up">Follow-Up</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No-Show</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-3 md:px-6 py-3 md:py-4">Date &amp; Time</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Patient</th>
                <th className="px-3 md:px-6 py-3 md:py-4 hidden sm:table-cell">Service</th>
                <th className="px-3 md:px-6 py-3 md:py-4 hidden md:table-cell">Type</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Status</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
              {filtered.map(appt => {
                const isBusy = updatingId === appt.id
                const dateStr = formatDate(appt.scheduled_at)
                const timeStr = formatTime(appt.scheduled_at)

                return (
                  <tr key={appt.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className="font-semibold text-slate-800 block">{dateStr}</span>
                      <span className="text-xs text-gray-400">{timeStr}</span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 font-semibold text-slate-900">
                      {appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : '—'}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-gray-600 hidden sm:table-cell">
                      {appt.services?.name ?? '—'}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 hidden md:table-cell">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border w-fit inline-block ${
                        appt.is_walk_in
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {appt.is_walk_in ? 'Walk-in' : 'Online'}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="flex items-center justify-end gap-2">
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'confirmed')}
                            disabled={isBusy}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {appt.status === 'confirmed' && (
                          isPastOrToday(appt.scheduled_at) ? (
                            <button
                              onClick={() => setCompletingAppt(appt)}
                              disabled={isBusy}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                            >
                              Complete &amp; Send to Billing
                            </button>
                          ) : (
                            <button
                              disabled
                              title="Available on the appointment date."
                              className="px-3 py-1.5 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg text-xs font-bold cursor-not-allowed"
                            >
                              Complete &amp; Send to Billing
                            </button>
                          )
                        )}
                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'no_show')}
                            disabled={isBusy}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition disabled:opacity-50"
                          >
                            No Show
                          </button>
                        )}
                        {canCancel(appt.status) && (
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'cancelled')}
                            disabled={isBusy}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-gray-400">
                    <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="font-medium text-slate-500">No appointments found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DentistChartBillingModal
        appointment={completingAppt}
        onClose={() => setCompletingAppt(null)}
        clinicId={clinicId}
        dentistUserId={dentistUserId}
        dentistId={dentistId}
        dentistName={dentistName}
        branchName={branchName}
        services={services}
        inventoryItems={inventoryItems}
        onSuccess={() => {
          setCompletingAppt(null)
          startTransition(() => router.refresh())
        }}
      />
    </div>
  )
}
