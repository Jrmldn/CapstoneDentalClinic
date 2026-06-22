'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, CreditCard, Smartphone, Wallet, RefreshCw, AlertCircle, Info } from 'lucide-react'
import { initiatePayment } from '@/actions/paymongoActions'
import type { PaymentContextType, OnlinePaymentMethod } from '@/actions/paymongoActions'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  description: string
  contextType: PaymentContextType
  contextId: number
  patientId: number
  onSuccess: () => void
}

const METHODS: { value: OnlinePaymentMethod; label: string; icon: React.ReactNode; note: string }[] = [
  {
    value: 'gcash',
    label: 'GCash',
    icon: <Smartphone className="w-5 h-5 text-blue-500" />,
    note: 'Pay via GCash e-wallet',
  },
  {
    value: 'paymaya',
    label: 'Maya',
    icon: <Wallet className="w-5 h-5 text-green-500" />,
    note: 'Pay via Maya e-wallet',
  },
  {
    value: 'credit_card',
    label: 'Credit / Debit Card',
    icon: <CreditCard className="w-5 h-5 text-slate-600" />,
    note: 'Visa, Mastercard accepted',
  },
]

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  description,
  contextType,
  contextId,
  patientId,
  onSuccess,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<OnlinePaymentMethod>('gcash')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !isOpen) return null

  const handlePay = async () => {
    setError('')
    setIsSubmitting(true)

    const res = await initiatePayment({
      contextType,
      contextId,
      patientId,
      amount,
      paymentMethod: selectedMethod,
      description,
    })

    setIsSubmitting(false)

    if (!res.success) {
      setError(res.error || 'Failed to initiate payment.')
      return
    }

    if (res.checkoutUrl) {
      // When PayMongo is live, redirect to hosted checkout
      window.location.href = res.checkoutUrl
    } else {
      // Stub path: PayMongo not yet integrated
      onSuccess()
      onClose()
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Pay Online
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px]">{description}</p>
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
            <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-1">Amount Due</p>
            <p className="text-3xl font-bold text-indigo-700">
              ₱{Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Coming-soon notice */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Online payment gateway is coming soon. Your payment request will be recorded and the
              clinic will be notified.
            </span>
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Select Payment Method</p>
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setSelectedMethod(m.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                  selectedMethod === m.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedMethod === m.value ? 'bg-white shadow-sm' : 'bg-gray-100'
                }`}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                  <p className="text-xs text-slate-400">{m.note}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                  selectedMethod === m.value
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-gray-300'
                }`} />
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Proceed to Payment'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
