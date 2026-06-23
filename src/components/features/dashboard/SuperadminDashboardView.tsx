'use client'

import React, { useState, useEffect } from 'react'
import { Building2, Users, Stethoscope, UserCircle, ArrowRight, Loader2 } from 'lucide-react'
import { getSuperadminStats } from '@/actions/dashboardActions'
import Link from 'next/link'
import { SuperadminStats } from '@/types/dashboard'
import { formatDate, formatDateLong } from '@/lib/date'

const colorMap = {
  blue: { card: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-700' },
  emerald: { card: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-700' },
  purple: { card: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-700' },
  amber: { card: 'bg-amber-50', icon: 'text-amber-500', text: 'text-amber-700' },
}

function StatCard({
  label, value, icon: Icon, color, href,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: keyof typeof colorMap
  href?: string
}) {
  const c = colorMap[color]
  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg ${c.card} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {href && <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition mt-1" />}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="mt-2 text-xs font-semibold text-gray-500">{label}</p>
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
        {cardContent}
      </Link>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
      {cardContent}
    </div>
  )
}

export default function SuperadminDashboardView() {
  const [stats, setStats] = useState<SuperadminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ARCH VIOLATION: stats should be fetched in the server page and passed as props, not fetched client-side via useEffect
  useEffect(() => {
    const fetchStats = async () => {
      const result = await getSuperadminStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
      setIsLoading(false)
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-[60vh] text-slate-400">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
        <p className="text-xs font-medium">Loading platform statistics...</p>
      </div>
    )
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const dateStr = formatDateLong(now)

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, Superadmin!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {dateStr} &bull; Platform Overview
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Branches"
          value={stats?.totalClinics ?? 0}
          icon={Building2}
          color="blue"
          href="/superadmin-dashboard/clinic"
        />

        <StatCard
          label="Active Staff"
          value={stats?.totalStaff ?? 0}
          icon={Users}
          color="emerald"
          href="/superadmin-dashboard/personnel"
        />

        <StatCard
          label="Dentists"
          value={stats?.totalDentists ?? 0}
          icon={Stethoscope}
          color="purple"
          href="/superadmin-dashboard/personnel"
        />

        <StatCard
          label="Registered Patients"
          value={stats?.totalPatients ?? 0}
          icon={UserCircle}
          color="amber"
        />
      </div>

      {/* Bottom Section: Recent Clinics */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-800">Recently Added Branches</h2>
          <Link 
            href="/superadmin-dashboard/clinic" 
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 border-b border-gray-100 bg-white">
              <tr>
                <th className="px-6 py-3.5">Branch Name</th>
                <th className="px-6 py-3.5">Date Added</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600 bg-white">
              {stats?.recentClinics && stats.recentClinics.length > 0 ? (
                stats.recentClinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{clinic.name}</td>
                    <td className="px-6 py-3.5 text-xs">
                      {clinic.created_at ? formatDate(clinic.created_at) : 'N/A'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        clinic.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {clinic.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-400 text-xs font-medium">
                    No branch clinics have been added yet.
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
