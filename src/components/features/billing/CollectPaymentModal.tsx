'use client'

import { useState } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { processPayment, PaymentMethod, PaymentStatus } from '@/actions/billingActions'
import { Transaction } from './BillingClient'

interface CollectPaymentModalProps {
  transaction: Transaction | null
  onClose: () => void
  onSuccess: () => void
}

export default function CollectPaymentModal({ transaction, onClose, onSuccess }: CollectPaymentModalProps) {
  const [collectPaymentMethod, setCollectPaymentMethod] = useState<PaymentMethod>(
    (transaction?.payment_method as PaymentMethod) ?? 'cash'
  )
  const [collectPaymentStatus, setCollectPaymentStatus] = useState<PaymentStatus>('paid')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return

    setIsSubmitting(true)
    const result = await processPayment(transaction.id, collectPaymentMethod, collectPaymentStatus)
    setIsSubmitting(false)

    if (result.success) {
      alert('Payment collected and recorded!')
      onClose()
      onSuccess()
    } else {
      alert(result.error || 'Failed to process payment')
    }
  }

  if (!transaction) return null

  return (
    <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-sm">Collect Payment</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-150 p-4 rounded-xl text-xs text-blue-800 space-y-2">
            <p><strong>Patient:</strong> {transaction.patients ? `${transaction.patients.first_name} ${transaction.patients.last_name}` : 'Unknown'}</p>
            <p><strong>Total Amount Due:</strong> ₱{Number(transaction.total_amount).toLocaleString()}</p>
            <p><strong>Current Status:</strong> <span className="uppercase font-bold">{transaction.payment_status}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Payment Method</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                value={collectPaymentMethod}
                onChange={e => setCollectPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
                <option value="paymaya">PayMaya</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-650 block">New Status</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                value={collectPaymentStatus}
                onChange={e => setCollectPaymentStatus(e.target.value as PaymentStatus)}
              >
                <option value="paid">Fully Paid</option>
                <option value="partial">Partially Paid</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
