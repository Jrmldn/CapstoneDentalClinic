import React from 'react'

export function getAppointmentStatusBadgeClass(status: string): string {
  switch (status) {
    case 'confirmed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'completed': return 'bg-slate-50 text-slate-600 border border-slate-200'
    case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200'
    case 'rescheduled': return 'bg-purple-50 text-purple-700 border border-purple-200'
    case 'no_show': return 'bg-orange-50 text-orange-700 border border-orange-200'
    case 'in_progress': return 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
    case 'follow_up': return 'bg-teal-50 text-teal-700 border border-teal-200'
    case 'pending_patient_confirm': return 'bg-purple-50 text-purple-700 border border-purple-200'
    default: return 'bg-gray-50 text-gray-700 border border-gray-200'
  }
}

export function getAppointmentStatusLabel(status: string): string {
  switch (status) {
    case 'in_progress': return 'In Progress'
    case 'pending_patient_confirm': return 'Pending Confirmation'
    case 'no_show': return 'No Show'
    case 'follow_up': return 'Follow-Up'
    default:
      if (!status) return 'Unknown'
      return status.replace(/_/g, ' ')
  }
}

interface AppointmentStatusBadgeProps {
  status: string
  className?: string
}

export function AppointmentStatusBadge({ status, className = '' }: AppointmentStatusBadgeProps) {
  const baseClasses = 'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full'
  const colorClasses = getAppointmentStatusBadgeClass(status)
  const label = getAppointmentStatusLabel(status)

  return (
    <span className={`${baseClasses} ${colorClasses} ${className}`}>
      {label}
    </span>
  )
}
