'use client'

import { DollarSign, Receipt, CalendarDays, CheckCircle, Eye } from 'lucide-react'
import { normalizeRelation } from '@/lib/utils'
import { getEligibleInstallmentService } from '@/utils/installment-helpers'
import { formatDate } from '@/lib/date'
import type { Transaction, InstallmentPlan } from './types'

function getDentistName(tx: Transaction): string | null {
  const appt = normalizeRelation(tx.appointments)
  if (!appt) return null
  const dentist = normalizeRelation(appt.dentists)
  if (!dentist) return null
  return `Dr. ${dentist.first_name} ${dentist.last_name}`
}

interface TransactionTableProps {
  filteredTransactions: Transaction[]
  installmentPlanByTxId: Record<number, InstallmentPlan>
  onCollectPayment?: (tx: Transaction) => void
  onSetInstallment?: (tx: Transaction) => void
  onViewInstallment?: (plan: InstallmentPlan) => void
  onFinalizeDraft?: (tx: Transaction) => void
  onViewReceipt?: (tx: Transaction) => void
}

function getBillingBadge(tx: Transaction) {
  if (tx.billing_status === 'draft') {
    return (
      <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded uppercase">
        From Dentist
      </span>
    )
  }
  return null
}

export default function TransactionTable({
  filteredTransactions,
  installmentPlanByTxId,
  onCollectPayment,
  onSetInstallment,
  onViewInstallment,
  onFinalizeDraft,
  onViewReceipt,
}: TransactionTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">Transaction ID</th>
              <th className="px-6 py-4">Patient</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Subtotal</th>
              <th className="px-6 py-4">Discounts</th>
              <th className="px-6 py-4">Total Amount</th>
              <th className="px-6 py-4">Payment Method</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
            {filteredTransactions.map((tx) => {
              const existingPlan = installmentPlanByTxId[tx.id]
              const isDraft = tx.billing_status === 'draft'
              const installmentEligible = getEligibleInstallmentService(tx) != null

              return (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">
                    #TX-{tx.id}
                    {existingPlan && (
                      <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded uppercase">
                        Installment
                      </span>
                    )}
                    {getBillingBadge(tx)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {tx.patients ? `${tx.patients.first_name} ${tx.patients.last_name}` : 'Unknown Patient'}
                    {isDraft && getDentistName(tx) && (
                      <span className="block text-[11px] font-medium text-gray-400 mt-0.5">
                        {getDentistName(tx)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {formatDate(tx.created_at)}
                  </td>
                  <td className="px-6 py-4 font-medium">₱{Number(tx.subtotal).toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs text-indigo-600 font-medium">
                    <div>{(tx.discount_amount ?? 0) > 0 ? `− ₱${Number(tx.discount_amount).toLocaleString()} (${tx.discount_type})` : '—'}</div>
                    {(() => {
                      const appt = normalizeRelation(tx.appointments)
                      const dp = appt?.downpayment
                      return dp && dp > 0 ? (
                        <div className="mt-0.5">− ₱{Number(dp).toLocaleString()} downpayment</div>
                      ) : null
                    })()}
                    {(tx.philhealth_coverage ?? 0) > 0 && (
                      <div className="mt-0.5">− ₱{Number(tx.philhealth_coverage).toLocaleString()} PhilHealth</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">₱{Number(tx.total_amount).toLocaleString()}</td>
                  <td className="px-6 py-4 capitalize text-gray-500">{tx.payment_method}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase w-fit ${
                        tx.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        tx.payment_status === 'partial' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {tx.payment_status}
                      </span>
                      {isDraft && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase w-fit bg-amber-50 text-amber-700 border border-amber-100">
                          Pending from Dentist
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {isDraft && onFinalizeDraft && (
                        <button
                          onClick={() => onFinalizeDraft(tx)}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-bold transition flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Finalize &amp; Collect
                        </button>
                      )}
                      {!isDraft && tx.payment_status !== 'paid' && !installmentPlanByTxId[tx.id] && onCollectPayment && (
                        <button
                          onClick={() => onCollectPayment(tx)}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-bold transition flex items-center gap-1"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Collect
                        </button>
                      )}
                      {onViewReceipt && (
                        <button
                          onClick={() => onViewReceipt(tx)}
                          className="px-3 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded text-xs font-bold transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Receipt
                        </button>
                      )}
                      {!isDraft && tx.payment_status !== 'paid' && (
                        existingPlan ? (
                          onViewInstallment && (
                            <button
                              onClick={() => onViewInstallment(existingPlan)}
                              className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-xs font-bold transition flex items-center gap-1"
                            >
                              <CalendarDays className="w-3.5 h-3.5" />
                              Installments
                            </button>
                          )
                        ) : (
                          installmentEligible && onSetInstallment && (
                            <button
                              onClick={() => onSetInstallment(tx)}
                              className="px-3 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded text-xs font-bold transition flex items-center gap-1"
                            >
                              <CalendarDays className="w-3.5 h-3.5" />
                              Set Installment
                            </button>
                          )
                        )
                      )}
                      {!isDraft && tx.payment_status === 'paid' && existingPlan && onViewInstallment && (
                        <button
                          onClick={() => onViewInstallment(existingPlan)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-xs font-bold transition flex items-center gap-1"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          Installments
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-20 text-gray-400">
                  <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="font-medium text-slate-500">No transactions recorded</p>
                  <p className="text-xs text-gray-400 mt-1">Try resetting your search query.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
