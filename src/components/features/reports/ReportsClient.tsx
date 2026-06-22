'use client'

import { useState } from 'react'
import {
  Calendar,
  DollarSign,
  Award,
  Users,
  Briefcase,
  RefreshCw,
  FileText,
} from 'lucide-react'
import {
  generateSalesReport,
  generateAppointmentSummary,
  generateServiceFrequency
} from '@/actions/reportActions'
import type { SalesReport, ApptReport, ServiceFrequencyReport } from './types'

interface ReportsClientProps {
  clinicId: number
  defaultSales: SalesReport | null
  defaultAppts: ApptReport | null
  defaultFreq: ServiceFrequencyReport | null
  startDate: string
  endDate: string
}

export default function ReportsClient({
  clinicId,
  defaultSales,
  defaultAppts,
  defaultFreq,
  startDate,
  endDate
}: ReportsClientProps) {
  const [from, setFrom] = useState(startDate)
  const [to, setTo] = useState(endDate)
  const [salesReport, setSalesReport] = useState<SalesReport | null>(defaultSales)
  const [apptReport, setApptReport] = useState<ApptReport | null>(defaultAppts)
  const [freqReport, setFreqReport] = useState<ServiceFrequencyReport | null>(defaultFreq)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'financial' | 'appointments' | 'services'>('financial')

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!from || !to) return
    setIsLoading(true)

    const [salesRes, apptRes, freqRes] = await Promise.all([
      generateSalesReport(clinicId, from, to),
      generateAppointmentSummary(clinicId, from, to),
      generateServiceFrequency(clinicId, from, to)
    ])

    setSalesReport(salesRes.success ? salesRes : null)
    setApptReport(apptRes.success ? apptRes : null)
    setFreqReport(freqRes.success ? freqRes : null)
    setIsLoading(false)
  }

  const salesSummary = salesReport?.summary || {
    totalTransactions: 0,
    totalRevenue: 0,
    totalSubtotal: 0,
    totalDiscounts: 0,
    totalPhilHealth: 0
  }

  const apptSummary = apptReport?.summary || {
    total: 0,
    walkIns: 0,
    countByStatus: {}
  }

  const freqList = freqReport?.serviceFrequency || []

  return (
    <div className="space-y-6">
      {/* Filter toolbar */}
      <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-gray-100 shadow-sm print:hidden">
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Report From Date</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                required
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={from}
                onChange={e => setFrom(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Report To Date</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                required
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={to}
                onChange={e => setTo(e.target.value)}
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : 'Generate Reports'}
        </button>
      </form>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 print:hidden">
        {[
          { id: 'financial', label: 'Financial & Revenue', icon: DollarSign },
          { id: 'appointments', label: 'Appointments Volume', icon: Users },
          { id: 'services', label: 'Service Popularity', icon: Briefcase }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition border-b-2 outline-none ${
                activeTab === tab.id
                  ? 'border-blue-650 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-b-xl border-x border-b border-gray-100 p-6 shadow-sm min-h-[400px] print:border-none print:shadow-none print:p-0">
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Gross Revenue</span>
                <span className="text-xl font-black text-slate-900 block mt-1">
                  ₱{Number(salesSummary.totalSubtotal).toLocaleString([], { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Discounts Applied</span>
                <span className="text-xl font-black text-indigo-600 block mt-1">
                  - ₱{Number(salesSummary.totalDiscounts).toLocaleString([], { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">PhilHealth Cover</span>
                <span className="text-xl font-black text-blue-600 block mt-1">
                  ₱{Number(salesSummary.totalPhilHealth || 0).toLocaleString([], { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-teal-50/20 border-emerald-250">
                <span className="text-[10px] font-bold text-emerald-850 block uppercase tracking-wider">Net Cash / Collected</span>
                <span className="text-xl font-black text-emerald-700 block mt-1">
                  ₱{Number(salesSummary.totalRevenue).toLocaleString([], { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-blue-600" />
                Transactions Log
              </h4>
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">TX ID</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Subtotal</th>
                      <th className="px-4 py-3">Discounts</th>
                      <th className="px-4 py-3">Net Collected</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-slate-700">
                    {salesReport?.transactions?.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-mono">#TX-{tx.id}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">
                          {tx.patients ? `${tx.patients.first_name} ${tx.patients.last_name}` : 'Unknown'}
                        </td>
                        <td className="px-4 py-2.5">₱{Number(tx.subtotal).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-indigo-650">- ₱{Number(tx.discount_amount).toLocaleString()}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">₱{Number(tx.total_amount).toLocaleString()}</td>
                        <td className="px-4 py-2.5 capitalize">{tx.payment_method}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                            tx.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {tx.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {(!salesReport?.transactions || salesReport.transactions.length === 0) && (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-gray-400">
                          No transactions recorded in this range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Bookings</span>
                <span className="text-xl font-black text-slate-900 block mt-1">{apptSummary.total}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Walk-In Bookings</span>
                <span className="text-xl font-black text-slate-700 block mt-1">{apptSummary.walkIns}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Completed Treatments</span>
                <span className="text-xl font-black text-emerald-600 block mt-1">
                  {apptSummary.countByStatus?.completed || 0}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Cancellation Rate</span>
                <span className="text-xl font-black text-red-600 block mt-1">
                  {apptSummary.total > 0
                    ? `${((apptSummary.countByStatus?.cancelled || 0) / apptSummary.total * 100).toFixed(0)}%`
                    : '0%'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Appointments Status Distribution</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show'].map(status => {
                  const val = apptSummary.countByStatus?.[status] || 0
                  return (
                    <div key={status} className="bg-slate-50/50 p-3 rounded-lg border border-gray-100 flex justify-between items-center text-xs capitalize">
                      <span className="text-gray-500 font-semibold">{status.replace('_', ' ')}:</span>
                      <span className="font-black text-slate-805 text-sm">{val}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-150 p-4 rounded-xl flex gap-3 text-blue-800 text-xs print:hidden">
              <Award className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-bold">Service Analytics Insight</p>
                <p className="mt-0.5 text-blue-700/90">
                  This report lists services offered by the clinic and ranks them by booking count frequency. Use this data to determine your most popular treatments.
                </p>
              </div>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">Rank</th>
                    <th className="px-6 py-3">Service Name</th>
                    <th className="px-6 py-3">Unit Service Fee</th>
                    <th className="px-6 py-3 text-right">Times Booked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-slate-755">
                  {freqList.map((svc, idx) => (
                    <tr key={svc.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 font-semibold text-gray-500">#{idx + 1}</td>
                      <td className="px-6 py-3 font-bold text-slate-900">{svc.name}</td>
                      <td className="px-6 py-3 font-medium">₱{Number(svc.price).toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-black text-blue-600 text-sm">
                        {svc.count}
                      </td>
                    </tr>
                  ))}

                  {freqList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400">
                        No service frequency data recorded in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
