'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
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

  const filtered = useMemo(() => transactions.filter(tx => {
    const patientName = `${tx.patients?.first_name || ''} ${tx.patients?.last_name || ''}`.toLowerCase()
    const matchesSearch = patientName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tx.payment_status === statusFilter
    const txDate = tx.created_at.slice(0, 10)
    const matchesDate = (!dateFrom || txDate >= dateFrom) && (!dateTo || txDate <= dateTo)
    return matchesSearch && matchesStatus && matchesDate
  }), [transactions, searchTerm, statusFilter, dateFrom, dateTo])

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [searchTerm, statusFilter, dateFrom, dateTo])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
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
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <TransactionTable
        filteredTransactions={paginated}
        installmentPlanByTxId={installmentPlanByTxId}
        onViewReceipt={(tx) => setReceiptTx(tx)}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} &mdash; {filtered.length} records
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

      <ReceiptModal
        transaction={receiptTx}
        onClose={() => setReceiptTx(null)}
        installmentPlan={receiptTx ? installmentPlanByTxId[receiptTx.id] ?? null : null}
      />
    </div>
  )
}
