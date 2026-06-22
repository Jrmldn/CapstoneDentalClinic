'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  CalendarDays,
  Users,
  Image as ImageIcon,
  Settings,
  ClipboardList,
} from 'lucide-react'

const menuGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',     href: '/dentist-dashboard',               icon: LayoutGrid,    key: 'home' },
      { label: 'Calendar',      href: '/dentist-dashboard/calendar',       icon: CalendarDays,  key: 'calendar' },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { label: 'Appointments',  href: '/dentist-dashboard/appointments',   icon: ClipboardList, key: 'appointments' },
      { label: 'Patients',      href: '/dentist-dashboard/patients',       icon: Users,         key: 'patients' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'My Profile',    href: '/dentist-dashboard/settings',       icon: Settings,      key: 'settings' },
    ],
  },
]

interface DentistSidebarProps {
  dentistName: string
  specialty: string
}

export default function DentistSidebar({ dentistName, specialty }: DentistSidebarProps) {
  const pathname = usePathname()

  const isActive = (key: string, href: string) => {
    if (key === 'home') return pathname === '/dentist-dashboard' || pathname === '/dentist-dashboard/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col flex-shrink-0 print:hidden">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold leading-tight">AppointDent</span>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Dentist Portal</p>
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 flex-shrink-0" />
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
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
            {dentistName ? dentistName.charAt(0) : 'D'}
          </div>
          <div className="truncate min-w-0">
            <span className="text-xs text-slate-400 font-semibold block truncate">Dr. {dentistName}</span>
            <span className="text-[10px] text-slate-500 font-medium block truncate">{specialty || 'General Dentist'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
