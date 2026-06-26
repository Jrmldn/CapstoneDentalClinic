'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchClinicTransactions } from '@/actions/billingActions'
import { fetchClinicInstallments } from '@/actions/installmentActions'
import TransactionTable from './TransactionTable'
import CreateInvoiceModal from './CreateInvoiceModal'
import CollectPaymentModal from './CollectPaymentModal'
import FinalizeDraftModal from './FinalizeDraftModal'
import InstallmentSetupModal from './InstallmentSetupModal'
import InstallmentDetailModal from './InstallmentDetailModal'
import type { AppointmentOption, Patient, Service, Product, Transaction, InstallmentPlan } from './types'

interface BillingClientProps {
  clinicId: number
  initialTransactions: Transaction[]
  initialInstallmentPlans: InstallmentPlan[]
  appointments: AppointmentOption[]
  services: Service[]
  products: Product[]
  patients: Patient[]
}

export default function BillingClient({
  clinicId,
  initialTransactions,
  initialInstallmentPlans,
  appointments,
  services,
  products,
  patients,
}: BillingClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>(initialInstallmentPlans)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [paymentTransaction, setPaymentTransaction] = useState<Transaction | null>(null)
  const [finalizingTx, setFinalizingTx] = useState<Transaction | null>(null)
  const [installmentSetupTx, setInstallmentSetupTx] = useState<Transaction | null>(null)
  const [installmentDetailPlan, setInstallmentDetailPlan] = useState<InstallmentPlan | null>(null)

  const installmentPlanByTxId = useMemo(
    () =>
      Object.fromEntries(
        installmentPlans
          .filter(p => p.transaction_id != null)
          .map(p => [p.transaction_id!, p])
      ) as Record<number, InstallmentPlan>,
    [installmentPlans]
  )

  const refreshAll = async () => {
    try {
      const [txResult, plansResult] = await Promise.all([
        fetchClinicTransactions(clinicId),
        fetchClinicInstallments(clinicId),
      ])
      if (txResult.success) setTransactions(txResult.transactions as Transaction[])
      if (plansResult.success) setInstallmentPlans(plansResult.plans as InstallmentPlan[])
    } catch {
      // silent failure — UI remains with stale data
    }
  }

  const filteredTransactions = useMemo(() => transactions.filter(tx => {
    // Base gate: only keep paid transactions if they have an *active* installment plan.
    // Completed/cancelled plans — like fully-paid non-installment transactions —
    // belong in Transactions (ledger) only.
    const installmentPlan = installmentPlanByTxId[tx.id]
    const hasActiveInstallment = installmentPlan?.status === 'active'
    if (tx.payment_status === 'paid' && !hasActiveInstallment) return false

    const patientName = `${tx.patients?.first_name || ''} ${tx.patients?.last_name || ''}`.toLowerCase()
    const matchesSearch = patientName.includes(searchTerm.toLowerCase())
    const txDate = (tx.created_at ?? '').slice(0, 10)
    const matchesDate = (!dateFrom || txDate >= dateFrom) && (!dateTo || txDate <= dateTo)
    let matchesStatus = true
    if (statusFilter === 'draft') matchesStatus = tx.billing_status === 'draft'
    else if (statusFilter === 'unpaid') matchesStatus = tx.payment_status === 'unpaid' && tx.billing_status !== 'draft'
    else if (statusFilter === 'partial') matchesStatus = tx.payment_status === 'partial'
    else if (statusFilter === 'paid') matchesStatus = tx.payment_status === 'paid'
    return matchesSearch && matchesDate && matchesStatus
  }), [transactions, installmentPlanByTxId, searchTerm, dateFrom, dateTo, statusFilter])

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const paginatedTransactions = filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [searchTerm, dateFrom, dateTo, statusFilter])

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient name..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="From date"
          />
          <input
            type="date"
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="To date"
          />
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Pending from Dentist</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm ml-auto"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      <TransactionTable
        filteredTransactions={paginatedTransactions}
        installmentPlanByTxId={installmentPlanByTxId}
        onCollectPayment={(tx) => setPaymentTransaction(tx)}
        onFinalizeDraft={(tx) => setFinalizingTx(tx)}
        onSetInstallment={(tx) => setInstallmentSetupTx(tx)}
        onViewInstallment={(plan) => setInstallmentDetailPlan(plan)}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} &mdash; {filteredTransactions.length} records
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

      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        clinicId={clinicId}
        appointments={appointments}
        services={services}
        products={products}
        patients={patients}
        onSuccess={refreshAll}
      />

      <CollectPaymentModal
        transaction={paymentTransaction}
        onClose={() => setPaymentTransaction(null)}
        onSuccess={refreshAll}
      />

      <FinalizeDraftModal
        transaction={finalizingTx}
        onClose={() => setFinalizingTx(null)}
        onSuccess={() => {
          setFinalizingTx(null)
          refreshAll()
        }}
        onSetInstallment={async (txId) => {
          const txResult = await fetchClinicTransactions(clinicId)
          const updated = txResult.success
            ? ((txResult.transactions as Transaction[]).find(t => t.id === txId) ?? null)
            : null
          if (txResult.success) setTransactions(txResult.transactions as Transaction[])
          setFinalizingTx(null)
          setInstallmentSetupTx(updated)
        }}
      />

      {installmentSetupTx && (
        <InstallmentSetupModal
          isOpen={!!installmentSetupTx}
          onClose={() => setInstallmentSetupTx(null)}
          transaction={installmentSetupTx}
          clinicId={clinicId}
          onSuccess={refreshAll}
        />
      )}

      {installmentDetailPlan && (
        <InstallmentDetailModal
          isOpen={!!installmentDetailPlan}
          onClose={() => setInstallmentDetailPlan(null)}
          plan={installmentDetailPlan}
          onSuccess={async () => {
            await refreshAll()
            setInstallmentDetailPlan(prev =>
              prev ? installmentPlans.find(p => p.id === prev.id) ?? null : null
            )
          }}
        />
      )}
    </div>
  )
}
