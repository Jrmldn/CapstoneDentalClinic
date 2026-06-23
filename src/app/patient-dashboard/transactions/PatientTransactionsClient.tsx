'use client'

import { useMemo, useState } from 'react'
import { Receipt, Eye } from 'lucide-react'
import ReceiptModal from '@/components/features/billing/ReceiptModal'
import { formatDate } from '@/lib/date'
import type { Transaction, InstallmentPlan } from '@/components/features/billing/types'

interface PatientTransactionsClientProps {
  transactions: Transaction[]
  installmentPlans: InstallmentPlan[]
}

export default function PatientTransactionsClient({ transactions, installmentPlans }: PatientTransactionsClientProps) {
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

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
        <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="font-medium text-slate-500">No transactions yet</p>
        <p className="text-xs text-gray-400 mt-1">Your completed invoices will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div key={tx.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500">#TX-{tx.id}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                tx.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                tx.payment_status === 'partial' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {tx.payment_status}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {formatDate(tx.created_at)}
            </p>
            {tx.transaction_items && tx.transaction_items.length > 0 && (
              <p className="text-sm text-slate-600 truncate">
                {tx.transaction_items[0].description}
                {tx.transaction_items.length > 1 ? ` +${tx.transaction_items.length - 1} more` : ''}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0 space-y-2">
            <p className="text-base font-bold text-slate-900">₱{Number(tx.total_amount).toLocaleString()}</p>
            <button
              onClick={() => setReceiptTx(tx)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold transition"
            >
              <Eye className="w-3.5 h-3.5" />
              View Receipt
            </button>
          </div>
        </div>
      ))}

      <ReceiptModal
        transaction={receiptTx}
        onClose={() => setReceiptTx(null)}
        installmentPlan={receiptTx ? installmentPlanByTxId[receiptTx.id] ?? null : null}
      />
    </div>
  )
}
