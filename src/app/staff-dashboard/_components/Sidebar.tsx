'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  CalendarDays,
  Users,
  ClipboardList,
  Receipt,
  Package,
  Image as ImageIcon,
  History,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StaffSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const menuGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',     href: '/staff-dashboard',               icon: LayoutGrid,    key: 'home' },
      { label: 'Calendar',      href: '/staff-dashboard/calendar',       icon: CalendarDays,  key: 'calendar' },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { label: 'Appointments',  href: '/staff-dashboard/appointments',   icon: ClipboardList, key: 'appointments' },
      { label: 'Patients',      href: '/staff-dashboard/patients',       icon: Users,         key: 'patients' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Billing',       href: '/staff-dashboard/billing',        icon: Receipt,       key: 'billing' },
      { label: 'Transactions',  href: '/staff-dashboard/transactions',   icon: History,       key: 'transactions' },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Inventory',     href: '/staff-dashboard/inventory',      icon: Package,       key: 'inventory' },
    ],
  },
]

export default function StaffSidebar({ isOpen, onClose }: StaffSidebarProps) {
  const pathname = usePathname()

  const isActive = (key: string, href: string) => {
    if (key === 'home') return pathname === '/staff-dashboard' || pathname === '/staff-dashboard/'
    return pathname.startsWith(href)
  }

  // Close sidebar on Escape key press
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Close sidebar on route change
  const onCloseRef = React.useRef(onClose)
  const isOpenRef = React.useRef(isOpen)
  React.useEffect(() => {
    onCloseRef.current = onClose
    isOpenRef.current = isOpen
  }, [onClose, isOpen])

  React.useEffect(() => {
    if (isOpenRef.current && onCloseRef.current) {
      onCloseRef.current()
    }
  }, [pathname])

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-60 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col flex-shrink-0 fixed inset-y-0 left-0 z-50 transform -translate-x-full transition-transform duration-200 md:relative md:translate-x-0 md:flex print:hidden",
          isOpen && "translate-x-0"
        )}
      >
        {/* Close button for mobile */}
        {isOpen && onClose && (
          <button
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Logo */}
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold leading-tight">AppointDent</span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Staff Portal</p>
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
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                      )}
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
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white">ST</span>
            </div>
            <span className="text-xs text-slate-400 font-medium truncate">Staff Account</span>
          </div>
        </div>
      </aside>
    </>
  )
}
