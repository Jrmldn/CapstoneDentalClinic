'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function MobileTabs() {
  const pathname = usePathname()

  const tabs = [
    { label: 'Overview', href: '/patient-dashboard/dashboard' },
    { label: 'Book', href: '/patient-dashboard/booking' },
    { label: 'Appointments', href: '/patient-dashboard/appointments' },
    { label: 'Calendar', href: '/patient-dashboard/calendar' },
    { label: 'Medical', href: '/patient-dashboard/clinicrecord' },
    { label: 'Payments', href: '/patient-dashboard/payments' },
    { label: 'Transactions', href: '/patient-dashboard/transactions' },
    { label: 'Profile', href: '/patient-dashboard/profile' },
  ]

  return (
    <div className="flex overflow-x-auto gap-2 pb-2 md:hidden no-scrollbar border-b border-slate-200">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border",
              active 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white text-slate-600 border-slate-200"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
