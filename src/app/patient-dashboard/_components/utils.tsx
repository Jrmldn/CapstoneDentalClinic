import React from 'react'
import { Badge } from '@/components/ui/badge'

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none font-semibold">Pending</Badge>
    case 'confirmed':
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-none font-semibold">Confirmed</Badge>
    case 'rescheduled':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none font-semibold">Rescheduled</Badge>
    case 'completed':
      return <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-semibold">Completed</Badge>
    case 'cancelled':
      return <Badge variant="secondary" className="bg-red-100 text-red-700 border-none font-semibold">Cancelled</Badge>
    case 'no_show':
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-none font-semibold">No Show</Badge>
    case 'follow_up':
      return <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-none font-semibold">Follow-Up</Badge>
    case 'pending_patient_confirm':
      return <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-none font-semibold">Confirm Reschedule</Badge>
    default:
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-none font-semibold">{status}</Badge>
  }
}
