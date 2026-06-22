'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Search, ChevronLeft, ChevronRight, Eye, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react'
import InstallmentDetailModal from './InstallmentDetailModal'
import type { InstallmentPlan, InstallmentPayment } from './types'

interface SuperadminInstallmentsClientProps {
  initialPlans: InstallmentPlan[]
  clinicOptions: { id: number; name: string }[]
}

const TODAY = new Date().toISOString().split('T')[0]

function getPlanProgress(plan: InstallmentPlan) {
  const payments = plan.installment_payments ?? []
  const paid = payments.filter(p => p.status === 'paid').length
  return { paid, total: payments.length }
}

function hasOverdue(payments: InstallmentPayment[]) {
  return payments.some(p => p.status !== 'paid' && p.due_date < TODAY)
}

function getPlanStatusBadge(plan: InstallmentPlan) {
  if (plan.status === 'completed') return { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (plan.status === 'cancelled') return { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500 border-gray-200' }
  if (hasOverdue(plan.installment_payments ?? [])) return { label: 'Overdue', cls: 'bg-red-50 text-red-700 border-red-200' }
  return { label: 'Active', cls: 'bg-blue-50 text-blue-700 border-blue-200' }
}

const PAGE_SIZE = 15

export default function SuperadminInstallmentsClient({
  initialPlans,
  clinicOptions,
}: SuperadminInstallmentsClientProps) {
  const [plans] = useState<InstallmentPlan[]>(initialPlans)
  const [search, setSearch] = useState('')
  const [clinicFilter, setClinicFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null)

  const stats = useMemo(() => {
    const active = plans.filter(p => p.status === 'active').length
    const completed = plans.filter(p => p.status === 'completed').length
    const overdue = plans.filter(p => p.status === 'active' && hasOverdue(p.installment_payments ?? [])).length
    const outstanding = plans
      .filter(p => p.status === 'active')
      .reduce((sum, p) => {
        const unpaid = (p.installment_payments ?? [])
          .filter(pay => pay.status !== 'paid')
          .reduce((s, pay) => s + Number(pay.amount), 0)
        return sum + unpaid
      }, 0)
    return { active, completed, overdue, outstanding }
  }, [plans])

  const filtered = useMemo(() => {
    return plans.filter(p => {
      const patientName = p.patients
        ? `${p.patients.first_name} ${p.patients.last_name}`.toLowerCase()
        : ''
      const clinicName = (p.clinics?.name ?? '').toLowerCase()
      const matchesSearch =
        patientName.includes(search.toLowerCase()) ||
        clinicName.includes(search.toLowerCase())
      const matchesClinic = clinicFilter === 'all' || String(p.clinic_id) === clinicFilter
      let matchesStatus = true
      if (statusFilter === 'active') matchesStatus = p.status === 'active' && !hasOverdue(p.installment_payments ?? [])
      else if (statusFilter === 'overdue') matchesStatus = p.status === 'active' && hasOverdue(p.installment_payments ?? [])
      else if (statusFilter === 'completed') matchesStatus = p.status === 'completed'
      else if (statusFilter === 'cancelled') matchesStatus = p.status === 'cancelled'
      return matchesSearch && matchesClinic && matchesStatus
    })
  }, [plans, search, clinicFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Plans"
          value={stats.active}
          icon={<Clock className="w-5 h-5 text-blue-500" />}
          bg="bg-blue-50"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          bg="bg-emerald-50"
        />
        <StatCard
          label="With Overdue"
          value={stats.overdue}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          bg="bg-red-50"
        />
        <StatCard
          label="Total Outstanding"
          value={`₱${stats.outstanding.toLocaleString()}`}
          icon={<XCircle className="w-5 h-5 text-amber-500" />}
          bg="bg-amber-50"
          valueClass="text-lg"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient or clinic..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={search}
              onChange={e => handleFilter(setSearch)(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
            value={clinicFilter}
            onChange={e => handleFilter(setClinicFilter)(e.target.value)}
          >
            <option value="all">All Clinics</option>
            {clinicOptions.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
            value={statusFilter}
            onChange={e => handleFilter(setStatusFilter)(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Clinic</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Progress</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No installment plans found.
                  </td>
                </tr>
              ) : paginated.map(plan => {
                const { paid, total } = getPlanProgress(plan)
                const { label, cls } = getPlanStatusBadge(plan)
                const patientName = plan.patients
                  ? `${plan.patients.first_name} ${plan.patients.last_name}`
                  : '—'
                const clinicName = plan.clinics?.name ?? '—'

                return (
                  <tr key={plan.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{patientName}</td>
                    <td className="px-4 py-3 text-slate-500">{clinicName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      ₱{Number(plan.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-500">{paid}/{total} paid</span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full transition-all"
                            style={{ width: total > 0 ? `${(paid / total) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${cls}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(plan.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedPlan(plan)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} — {filtered.length} plans
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedPlan && (
        <InstallmentDetailModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan}
          onSuccess={() => setSelectedPlan(null)}
          readOnly
        />
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  bg,
  valueClass = 'text-2xl',
}: {
  label: string
  value: string | number
  icon: ReactNode
  bg: string
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className={`font-bold text-slate-900 ${valueClass}`}>{value}</p>
      </div>
    </div>
  )
}
