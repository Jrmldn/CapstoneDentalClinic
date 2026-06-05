'use client'

import { useState, useEffect } from 'react'
import { Building2, Users, Stethoscope, UserCircle, ArrowRight } from 'lucide-react'
import { getSuperadminStats } from '@/actions/dashboardActions'
import Link from 'next/link'
import { SuperadminStats } from '@/types' // FIX: Imported SuperadminStats

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<SuperadminStats | null>(null) // FIX: Replaced any
  const [isLoading, setIsLoading] = useState(true)

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
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  return (
    <div className="p-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, Superadmin. Here is what is happening across AppointDent today.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Clinics</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.totalClinics}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Staff</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.totalStaff}</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Dentists</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.totalDentists}</h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Registered Patients</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.totalPatients}</h3>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Clinics */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-[#f8f9fa]">
          <h2 className="text-base font-semibold text-slate-900">Recently Added Clinics</h2>
          <Link 
            href="/superadmin-dashboard/clinic" 
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Clinic Name</th>
                <th className="px-6 py-4">Date Added</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {stats?.recentClinics && stats.recentClinics.length > 0 ? (
                stats.recentClinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{clinic.name}</td>
                    <td className="px-6 py-4">
                      {new Date(clinic.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                        clinic.is_active 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {clinic.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No clinics have been added yet.
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