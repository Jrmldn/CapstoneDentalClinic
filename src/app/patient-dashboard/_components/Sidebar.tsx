'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  User,
  Activity,
  Plus,
  LayoutGrid,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PatientSidebarProps {
  patientName: string
}

const menuGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/patient-dashboard/dashboard', icon: LayoutGrid, key: 'dashboard' },
    ],
  },
  {
    label: 'Appointments',
    items: [
      { label: 'Book Appointment', href: '/patient-dashboard/booking', icon: Plus, key: 'booking' },
      { label: 'My Appointments', href: '/patient-dashboard/appointments', icon: CalendarDays, key: 'appointments' },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { label: 'My Calendar', href: '/patient-dashboard/calendar', icon: CalendarDays, key: 'calendar' },
      { label: 'Clinical Records', href: '/patient-dashboard/clinicrecord', icon: ClipboardList, key: 'clinicrecord' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile Details', href: '/patient-dashboard/profile', icon: User, key: 'profile' },
    ],
  },
]

export default function PatientSidebar({ patientName }: PatientSidebarProps) {
  const pathname = usePathname()

  const isActive = (key: string, href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-60 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col flex-shrink-0 hidden md:flex print:hidden">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold leading-tight">AppointDent</span>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Patient Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.key, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/60"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer badge */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-white">
              {patientName?.[0] || 'P'}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium truncate">Patient Account</span>
        </div>
      </div>
    </aside>
  )
}
