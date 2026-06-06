'use client'

import React from 'react'
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

const colorMap = {
  blue: { card: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-700' },
  emerald: { card: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-700' },
  amber: { card: 'bg-amber-50', icon: 'text-amber-500', text: 'text-amber-700' },
  rose: { card: 'bg-rose-50', icon: 'text-rose-500', text: 'text-rose-700' },
}

function StatCard({
  label, value, sub, icon: Icon, color, href,
}: {
  label: string
  value: string | number
  sub: string
  icon: React.ElementType
  color: keyof typeof colorMap
  href: string
}) {
  const c = colorMap[color]
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg ${c.card} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition mt-1" />
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-blue-50 text-blue-700',
    pending: 'bg-amber-50 text-amber-700',
    completed: 'bg-emerald-50 text-emerald-700',
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
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
                const time = new Date(appt.scheduled_at).toLocaleTimeString('en-US', {
                  hour: 'numeric', minute: '2-digit', hour12: true
                })
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
