'use client'

import { useState } from 'react'
import {
  Search,
  Bell,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Mail,
  Smartphone,
  Play
} from 'lucide-react'
import { retriggerNotification, fetchNotifications } from '@/actions/managementActions'

interface Notification {
  id: number
  appointment_id: number
  patient_id: number
  type: string
  status: string
  message_body: string
  error_message?: string | null
  created_at: string
  patients: { id: number; first_name: string; last_name: string; phone: string } | null
  appointments: { id: number; scheduled_at: string } | null
}

interface NotificationsClientProps {
  clinicId: number
  initialNotifications: Notification[]
}

export default function NotificationsClient({
  clinicId,
  initialNotifications
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const refreshLogs = async () => {
    const res = await fetchNotifications(clinicId)
    if (res.success) {
      setNotifications(res.notifications as Notification[])
    }
  }

  const handleRetrigger = async (notificationId: number) => {
    setIsSubmitting(true)
    const res = await retriggerNotification(notificationId)
    setIsSubmitting(false)

    if (res.success) {
      alert('Notification marked as pending and queued for resend!')
      refreshLogs()
    } else {
      alert(res.error || 'Failed to retrigger notification')
    }
  }

  // Filter logs
  const filteredNotifications = notifications.filter(n => {
    const patientName = `${n.patients?.first_name || ''} ${n.patients?.last_name || ''}`.toLowerCase()
    const matchesSearch = patientName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || n.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient name..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Dispatch Statuses</option>
            <option value="sent">Sent Successfully</option>
            <option value="pending">Pending Dispatch</option>
            <option value="failed">Failed Dispatch</option>
          </select>
        </div>
        <button
          onClick={refreshLogs}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Dispatch Logs
        </button>
      </div>

      {/* Notifications Grid/Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Created Date &amp; Time</th>
                <th className="px-6 py-4">Message Body</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-slate-705">
              {filteredNotifications.map((notif) => (
                <tr key={notif.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {notif.patients ? `${notif.patients.first_name} ${notif.patients.last_name}` : 'Unknown Patient'}
                      </p>
                      <p className="text-xs text-gray-500">{notif.patients?.phone || 'No phone'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-gray-650">
                      {notif.type === 'sms' ? (
                        <>
                          <Smartphone className="w-4 h-4 text-blue-500" />
                          SMS Gateway
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-indigo-500" />
                          Email Gateway
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(notif.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </td>
                  <td className="px-6 py-4 max-w-xs md:max-w-md">
                    <p className="text-slate-800 text-xs truncate" title={notif.message_body}>
                      {notif.message_body}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        notif.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        notif.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-750 border border-red-200'
                      }`}>
                        {notif.status}
                      </span>
                      {notif.status === 'failed' && notif.error_message && (
                        <p className="text-[10px] text-red-600 mt-1 max-w-[150px] truncate" title={notif.error_message}>
                          Reason: {notif.error_message}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {notif.status === 'failed' && (
                      <button
                        onClick={() => handleRetrigger(notif.id)}
                        disabled={isSubmitting}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-bold transition flex items-center gap-1 inline-flex disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Retrigger Dispatch
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredNotifications.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-gray-400">
                    <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="font-medium text-slate-500">No dispatch logs found</p>
                    <p className="text-xs text-gray-400 mt-1">Try resetting your status filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
