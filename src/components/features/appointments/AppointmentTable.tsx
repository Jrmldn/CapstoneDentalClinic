'use client'

import { Calendar, Clock, Check, X, DollarSign } from 'lucide-react'
import type { Appointment } from './AppointmentTypes'

interface AppointmentTableProps {
  filteredAppointments: Appointment[]
  onConfirm: (id: number) => void
  onReschedule: (appt: Appointment) => void
  onOpenBilling: (appt: Appointment) => void
  onCancel: (appt: Appointment) => void
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'confirmed': return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200'
    case 'rescheduled': return 'bg-purple-50 text-purple-700 border border-purple-200'
    default: return 'bg-gray-50 text-gray-700 border border-gray-200'
  }
}

export default function AppointmentTable({
  filteredAppointments,
  onConfirm,
  onReschedule,
  onOpenBilling,
  onCancel
}: AppointmentTableProps) {
  return (
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
                          onClick={() => onConfirm(appt.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Confirm Appointment"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {(appt.status === 'pending' || appt.status === 'confirmed' || appt.status === 'rescheduled') && (
                        <>
                          <button
                            onClick={() => onReschedule(appt)}
                            className="px-2 py-1 text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-xs font-semibold"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => onOpenBilling(appt)}
                            className="px-2 py-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Complete &amp; Bill
                          </button>
                          <button
                            onClick={() => onCancel(appt)}
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
  )
}
