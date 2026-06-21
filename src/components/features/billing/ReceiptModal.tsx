'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer } from 'lucide-react'
import type { Transaction, InstallmentPlan } from './types'

interface ReceiptModalProps {
  transaction: Transaction | null
  onClose: () => void
  clinicName?: string
  installmentPlan?: InstallmentPlan | null
}

export default function ReceiptModal({ transaction, onClose, clinicName, installmentPlan }: ReceiptModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !transaction) return null

  const patientName = transaction.patients
    ? `${transaction.patients.first_name} ${transaction.patients.last_name}`
    : 'Unknown Patient'

  const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  // When an installment plan is still being collected, the receipt must reflect
  // the amount actually paid so far, not the full invoice total.
  const payments = installmentPlan?.installment_payments ?? []
  const fullyPaid = transaction.payment_status === 'paid'
  const showInstallmentProgress = payments.length > 0 && !fullyPaid
  const paidCount = payments.filter(p => p.status === 'paid').length
  const amountPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const balanceRemaining = Math.max(0, Number(transaction.total_amount) - amountPaid)

  return createPortal(
    <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs print:bg-white print:block print:p-0">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-150 print:shadow-none print:rounded-none print:max-w-none">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl print:hidden">
          <h3 className="font-bold text-slate-900">Receipt</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 text-sm text-slate-700">
          {/* Header */}
          <div className="text-center space-y-0.5">
            <p className="text-base font-bold text-slate-900">{clinicName ?? 'AppoinDent Dental Clinic'}</p>
            <p className="text-xs text-gray-400">Official Receipt</p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-1 text-xs border-t border-dashed border-gray-200 pt-3">
            <span className="text-gray-400 font-semibold">Receipt #</span>
            <span className="text-right font-mono font-bold">TX-{transaction.id}</span>
            <span className="text-gray-400 font-semibold">Patient</span>
            <span className="text-right font-medium">{patientName}</span>
            <span className="text-gray-400 font-semibold">Date</span>
            <span className="text-right">{date}</span>
            <span className="text-gray-400 font-semibold">Payment</span>
            <span className="text-right capitalize">{transaction.payment_method}</span>
          </div>

          {/* Line items */}
          {transaction.transaction_items && transaction.transaction_items.length > 0 && (
            <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Services</p>
              {transaction.transaction_items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span>{item.description} × {item.quantity}</span>
                  <span className="font-medium">₱{Number(item.total_price).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Amounts */}
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>₱{Number(transaction.subtotal).toLocaleString()}</span>
            </div>
            {transaction.discount_amount > 0 && (
              <div className="flex justify-between text-indigo-600">
                <span>Discount ({transaction.discount_type})</span>
                <span>- ₱{Number(transaction.discount_amount).toLocaleString()}</span>
              </div>
            )}
            {transaction.philhealth_coverage > 0 && (
              <div className="flex justify-between text-teal-600">
                <span>PhilHealth Coverage</span>
                <span>- ₱{Number(transaction.philhealth_coverage).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Total */}
          {showInstallmentProgress ? (
            <div className="border-t-2 border-slate-900 pt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Invoice Amount</span>
                <span>₱{Number(transaction.total_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Amount Paid So Far</span>
                <span className="text-base">₱{amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-amber-600">
                <span>Balance Remaining</span>
                <span>₱{balanceRemaining.toLocaleString()}</span>
              </div>
              <p className="text-center text-[11px] font-semibold text-indigo-600 pt-1">
                {paidCount} of {payments.length} installments paid
              </p>
            </div>
          ) : (
            <div className="border-t-2 border-slate-900 pt-3 flex justify-between font-bold text-slate-900">
              <span>Total Paid</span>
              <span className="text-base">₱{Number(transaction.total_amount).toLocaleString()}</span>
            </div>
          )}

          <p className="text-center text-[10px] text-gray-400 pt-1">Thank you for choosing AppoinDent!</p>
        </div>
      </div>
    </div>,
    document.body
  )
}
