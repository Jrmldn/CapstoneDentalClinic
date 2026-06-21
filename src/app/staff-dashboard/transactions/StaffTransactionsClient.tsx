'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import TransactionTable from '@/components/features/billing/TransactionTable'
import ReceiptModal from '@/components/features/billing/ReceiptModal'
import type { Transaction, InstallmentPlan } from '@/components/features/billing/types'

interface StaffTransactionsClientProps {
  transactions: Transaction[]
  installmentPlans: InstallmentPlan[]
}

export default function StaffTransactionsClient({ transactions, installmentPlans }: StaffTransactionsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null)

  const installmentPlanByTxId = useMemo(
    () =>
      Object.fromEntries(
        installmentPlans
          .filter(p => p.transaction_id != null)
          .map(p => [p.transaction_id!, p])
      ) as Record<number, InstallmentPlan>,
    [installmentPlans]
  )

  const filtered = transactions.filter(tx => {
    const patientName = `${tx.patients?.first_name || ''} ${tx.patients?.last_name || ''}`.toLowerCase()
    const matchesSearch = patientName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tx.payment_status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient name..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <TransactionTable
        filteredTransactions={filtered}
        installmentPlanByTxId={installmentPlanByTxId}
        onViewReceipt={(tx) => setReceiptTx(tx)}
      />

      <ReceiptModal
        transaction={receiptTx}
        onClose={() => setReceiptTx(null)}
        installmentPlan={receiptTx ? installmentPlanByTxId[receiptTx.id] ?? null : null}
      />
    </div>
  )
}
