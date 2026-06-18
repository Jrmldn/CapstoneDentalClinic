'use client'

import React, { useState } from 'react'
import { BarChart3, Building, Loader2, ArrowRight } from 'lucide-react'
import ReportsClient from './ReportsClient'
import {
  generateSalesReport,
  generateAppointmentSummary,
  generateServiceFrequency
} from '@/actions/managementActions'

interface ClinicOption {
  id: number
  name: string
}

interface SuperadminReportsViewProps {
  clinics: ClinicOption[]
}

export default function SuperadminReportsView({ clinics }: SuperadminReportsViewProps) {
  const [selectedClinicId, setSelectedClinicId] = useState<number | ''>('')
  const [salesReport, setSalesReport] = useState<any>(null)
  const [apptReport, setApptReport] = useState<any>(null)
  const [freqReport, setFreqReport] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Default date ranges (last 30 days)
  const todayObj = new Date()
  const today = todayObj.toISOString().slice(0, 10)
  
  const thirtyDaysAgoObj = new Date()
  thirtyDaysAgoObj.setDate(thirtyDaysAgoObj.getDate() - 30)
  const thirtyDaysAgo = thirtyDaysAgoObj.toISOString().slice(0, 10)

  const handleClinicChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (!val) {
      setSelectedClinicId('')
      setSalesReport(null)
      setApptReport(null)
      setFreqReport(null)
      return
    }

    const clinicId = Number(val)
    setSelectedClinicId(clinicId)
    setIsLoading(true)

    try {
      const [salesRes, apptRes, freqRes] = await Promise.all([
        generateSalesReport(clinicId, thirtyDaysAgo, today),
        generateAppointmentSummary(clinicId, thirtyDaysAgo, today),
        generateServiceFrequency(clinicId, thirtyDaysAgo, today)
      ])

      setSalesReport(salesRes.success ? salesRes : null)
      setApptReport(apptRes.success ? apptRes : null)
      setFreqReport(freqRes.success ? freqRes : null)
    } catch (err) {
      console.error('Failed to load reports for clinic:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports &amp; Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track branch revenue, appointments, and service usage frequency across all locations.
          </p>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-xs min-w-[280px]">
          <Building className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none mb-0.5">Select Branch</span>
            <select
              value={selectedClinicId}
              onChange={handleClinicChange}
              disabled={isLoading}
              className="w-full text-xs font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer focus:ring-0 p-0"
            >
              <option value="">Choose a branch...</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Reports Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium text-slate-500">Loading branch records and analytics...</p>
        </div>
      ) : selectedClinicId ? (
        <ReportsClient
          key={selectedClinicId}
          clinicId={selectedClinicId}
          defaultSales={salesReport}
          defaultAppts={apptReport}
          defaultFreq={freqReport}
          startDate={thirtyDaysAgo}
          endDate={today}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-2xl shadow-xs text-center px-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">No Branch Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
            Select one of your clinic branches in the header dropdown to view sales reports, appointment metrics, and service usage logs.
          </p>
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 animate-pulse">
            Select a branch above to start <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}
    </div>
  )
}
