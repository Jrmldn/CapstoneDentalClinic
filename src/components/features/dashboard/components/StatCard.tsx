'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const colorMap = {
  blue: { card: 'bg-blue-50', icon: 'text-blue-600' },
  emerald: { card: 'bg-emerald-50', icon: 'text-emerald-600' },
  amber: { card: 'bg-amber-50', icon: 'text-amber-500' },
  rose: { card: 'bg-rose-50', icon: 'text-rose-500' },
  purple: { card: 'bg-purple-50', icon: 'text-purple-600' },
}

export interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: keyof typeof colorMap
  href?: string
}

export default function StatCard({ label, value, sub, icon: Icon, color, href }: StatCardProps) {
  const c = colorMap[color]
  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg ${c.card} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {href && <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition mt-1" />}
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
    </>
  )

  if (href) {
    return (
      <Link href={href} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
        {content}
      </Link>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      {content}
    </div>
  )
}
