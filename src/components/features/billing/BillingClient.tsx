'use client'

import { useMemo, useState } from 'react'
import { Search, Plus } from 'lucide-react'
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

  // Billing = action items: drafts OR unpaid invoices
  const filteredTransactions = transactions.filter(tx => {
    const patientName = `${tx.patients?.first_name || ''} ${tx.patients?.last_name || ''}`.toLowerCase()
    const matchesSearch = patientName.includes(searchTerm.toLowerCase())
    const isActionItem = tx.billing_status === 'draft' || tx.payment_status !== 'paid'
    return matchesSearch && isActionItem
  })

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient name..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => setIsInvoiceModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <TransactionTable
        filteredTransactions={filteredTransactions}
        installmentPlanByTxId={installmentPlanByTxId}
        onCollectPayment={(tx) => setPaymentTransaction(tx)}
        onFinalizeDraft={(tx) => setFinalizingTx(tx)}
        onSetInstallment={(tx) => setInstallmentSetupTx(tx)}
        onViewInstallment={(plan) => setInstallmentDetailPlan(plan)}
      />

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
