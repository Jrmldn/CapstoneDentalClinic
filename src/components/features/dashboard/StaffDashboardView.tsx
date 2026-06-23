'use client'

import {
  CalendarDays,
  Users,
  Package,
  Receipt,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { StaffDashboardStats } from '@/utils/dashboard-helpers'
import StatCard from './components/StatCard'
import { formatTime, formatDateLong } from '@/lib/date'

export interface Appointment {
  id: number
  scheduled_at: string
  status: string
  patients: { first_name: string; last_name: string } | null
  services: { name: string } | null
}

interface StaffDashboardViewProps {
  staffName: string
  todayAppts: Appointment[]
  stats: StaffDashboardStats
}


function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    completed: 'bg-slate-100 text-slate-600',
    rescheduled: 'bg-purple-50 text-purple-700',
    cancelled: 'bg-red-50 text-red-600',
    no_show: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function StaffDashboardView({ staffName, todayAppts, stats }: StaffDashboardViewProps) {
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {staffName} !
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {formatDateLong(new Date())}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Today's Appointments"
          value={todayAppts.length}
          sub={`${stats.confirmedToday} confirmed · ${stats.pendingToday} pending`}
          icon={CalendarDays}
          color="blue"
          href="/staff-dashboard/appointments"
        />
        <StatCard
          label="Total Patients"
          value={stats.uniquePatients}
          sub="All-time at this clinic"
          icon={Users}
          color="emerald"
          href="/staff-dashboard/patients"
        />
        <StatCard
          label="Low Stock Items"
          value={stats.lowStockCount}
          sub={stats.lowStockCount > 0 ? 'Needs restocking' : 'All levels normal'}
          icon={Package}
          color={stats.lowStockCount > 0 ? 'amber' : 'emerald'}
          href="/staff-dashboard/inventory"
        />
        <StatCard
          label="Unpaid This Month"
          value={`₱${stats.unpaidTotal.toFixed(0)}`}
          sub={`${stats.unpaidTotal > 0 ? 'Pending collection' : 'Fully collected'}`}
          icon={Receipt}
          color="rose"
          href="/staff-dashboard/billing"
        />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's schedule */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-800">Today&apos;s Schedule</h2>
            <Link
              href="/staff-dashboard/appointments"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {todayAppts.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No appointments today</p>
              </div>
            ) : (
              todayAppts.slice(0, 6).map((appt) => {
                const patient = appt.patients
                const service = appt.services
                const time = formatTime(appt.scheduled_at)
                return (
                  <div key={appt.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0">
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{service?.name ?? '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-500">{time}</span>
                      <StatusBadge status={appt.status} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-800">Inventory Alerts</h2>
            <Link
              href="/staff-dashboard/inventory"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.lowStockItems.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All stock levels are normal</p>
              </div>
            ) : (
              stats.lowStockItems.slice(0, 6).map((item) => (
                <div key={item.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                    {Number(item.quantity)} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
