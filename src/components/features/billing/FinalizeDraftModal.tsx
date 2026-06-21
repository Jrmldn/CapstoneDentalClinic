'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, RefreshCw, CheckCircle } from 'lucide-react'
import { finalizeDraftInvoice } from '@/actions/billingActions'
import { normalizeRelation } from '@/lib/utils'
import type { Transaction } from './types'

function getDentistName(transaction: Transaction): string | null {
  const appt = normalizeRelation(transaction.appointments)
  if (!appt) return null
  const dentist = normalizeRelation(appt.dentists)
  if (!dentist) return null
  return `Dr. ${dentist.first_name} ${dentist.last_name}`
}

interface FinalizeDraftModalProps {
  transaction: Transaction | null
  onClose: () => void
  onSuccess: () => void
  onSetInstallment: (txId: number) => void
}

export default function FinalizeDraftModal({ transaction, onClose, onSuccess, onSetInstallment }: FinalizeDraftModalProps) {
  const [resolutionMode, setResolutionMode] = useState<'collect' | 'installment'>('collect')
  const [discountType, setDiscountType] = useState<'none' | 'senior' | 'pwd' | 'philhealth'>('none')
  const [philhealthCoverage, setPhilhealthCoverage] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'credit_card' | 'paymaya'>('cash')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (transaction) {
      setResolutionMode('collect')
      setDiscountType('none')
      setPhilhealthCoverage('0')
      setPaymentMethod('cash')
    }
  }, [transaction])

  const computeTotal = () => {
    if (!transaction) return 0
    const rate = discountType === 'senior' || discountType === 'pwd' ? 0.2 : 0
    const discount = transaction.subtotal * rate
    const philhealth = parseFloat(philhealthCoverage) || 0
    const appt = normalizeRelation(transaction.appointments)
    const downpayment = appt?.downpayment ?? 0
    return Math.max(0, transaction.subtotal - discount - philhealth - downpayment)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return
    setIsSubmitting(true)
    setErrorMsg(null)

    const res = await finalizeDraftInvoice(transaction.id, {
      discount_type: discountType,
      philhealth_coverage: parseFloat(philhealthCoverage) || 0,
      payment_method: paymentMethod,
      payment_status: resolutionMode === 'collect' ? 'paid' : 'unpaid',
    })

    setIsSubmitting(false)
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to finalize invoice')
      return
    }

    if (resolutionMode === 'installment') {
      onSetInstallment(transaction.id)
    } else {
      onSuccess()
    }
  }

  if (!mounted || !transaction) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Finalize Draft Invoice
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2 text-sm text-slate-700">
            <p><strong>Patient:</strong> {transaction.patients ? `${transaction.patients.first_name} ${transaction.patients.last_name}` : 'Unknown'}</p>
            {getDentistName(transaction) && (
              <p className="text-xs text-slate-500">Performed by {getDentistName(transaction)}</p>
            )}
            {transaction.transaction_items && transaction.transaction_items.length > 0 && (
              <div className="border-t border-gray-200 pt-2 space-y-1">
                {transaction.transaction_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span>{item.description}</span>
                    <span className="font-medium">₱{Number(item.total_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-xs font-medium">
              <span>Subtotal</span>
              <span>₱{Number(transaction.subtotal).toLocaleString()}</span>
            </div>
            {(() => {
              const appt = normalizeRelation(transaction.appointments)
              const dp = appt?.downpayment ?? 0
              return dp > 0 ? (
                <p className="flex justify-between text-xs text-indigo-650 font-medium">
                  <span>Downpayment on file</span>
                  <span>- ₱{Number(dp).toLocaleString()}</span>
                </p>
              ) : null
            })()}
            <p className="flex justify-between border-t border-gray-250 pt-2 font-bold text-slate-950 text-sm">
              <span>Total Payable:</span>
              <span>₱{computeTotal().toLocaleString()}</span>
            </p>
          </div>

          {/* Resolution mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 block">Payment Resolution</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="resolutionMode"
                  value="collect"
                  checked={resolutionMode === 'collect'}
                  onChange={() => setResolutionMode('collect')}
                  className="accent-emerald-600"
                />
                Collect Payment now
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="resolutionMode"
                  value="installment"
                  checked={resolutionMode === 'installment'}
                  onChange={() => setResolutionMode('installment')}
                  className="accent-indigo-600"
                />
                Set up Installment
              </label>
            </div>
          </div>

          <div className={resolutionMode === 'collect' ? 'grid grid-cols-2 gap-4' : ''}>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Apply Discount</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                value={discountType}
                onChange={e => setDiscountType(e.target.value as typeof discountType)}
              >
                <option value="none">No Discount</option>
                <option value="senior">Senior Citizen (20%)</option>
                <option value="pwd">PWD (20%)</option>
                <option value="philhealth">PhilHealth Coverage</option>
              </select>
            </div>
            {resolutionMode === 'collect' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Payment Method</label>
                <select
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as typeof paymentMethod)}
                >
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="paymaya">PayMaya</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>
            )}
          </div>

          {discountType === 'philhealth' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">PhilHealth Deductible Amount (₱)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="Enter amount"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                value={philhealthCoverage}
                onChange={e => setPhilhealthCoverage(e.target.value)}
              />
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMsg}</p>
          )}

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
              className={`px-5 py-2 text-white rounded-lg transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2 ${
                resolutionMode === 'installment'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : resolutionMode === 'installment'
                  ? 'Apply & Set Installment'
                  : 'Collect & Mark Paid'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
