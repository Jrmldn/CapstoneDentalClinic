'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, Clock, RefreshCw, CalendarDays } from 'lucide-react'
import { markInstallmentPaid } from '@/actions/installmentActions'
import { formatDate } from '@/lib/date'
import type { InstallmentPlan, InstallmentPayment } from './types'

interface InstallmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  plan: InstallmentPlan
  onSuccess: () => void
  readOnly?: boolean
}

function getPaymentStatus(payment: InstallmentPayment) {
  if (payment.status === 'paid') return { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
  return { label: 'Pending', color: 'bg-blue-50 text-blue-700 border-blue-100' }
}

export default function InstallmentDetailModal({
  isOpen,
  onClose,
  plan,
  onSuccess,
  readOnly = false,
}: InstallmentDetailModalProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !isOpen) return null

  const payments = [...(plan.installment_payments ?? [])].sort(
    (a, b) => a.installment_number - b.installment_number
  )
  const patientName = plan.patients
    ? `${plan.patients.first_name} ${plan.patients.last_name}`
    : 'Unknown Patient'

  const handleMarkPaid = async (payment: InstallmentPayment) => {
    setError('')
    setLoadingId(payment.id)
    const res = await markInstallmentPaid(payment.id, plan.id)
    setLoadingId(null)
    if (res.success) onSuccess()
    else setError(res.error || 'Failed to mark as paid.')
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              Installment Plan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {patientName} — ₱{Number(plan.total_amount).toLocaleString()} total
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Plan summary */}
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Plan Status</span>
              <span className={`font-bold capitalize ${
                plan.status === 'completed' ? 'text-emerald-600' :
                plan.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {plan.status}
              </span>
            </div>
            {plan.notes && (
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500 shrink-0">Notes</span>
                <span className="text-right">{plan.notes}</span>
              </div>
            )}
          </div>

          {/* Installment payments */}
          <div className="space-y-2">
            {payments.map((payment) => {
              const { label, color } = getPaymentStatus(payment)
              const isLoading = loadingId === payment.id

              return (
                <div key={payment.id} className="border border-gray-100 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {payment.status === 'paid' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-400" />
                      )}
                      <span className="text-sm font-bold text-slate-800">
                        Installment {payment.installment_number}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${color}`}>
                      {label}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Amount: </span>
                      <span className="font-semibold">₱{Number(payment.amount).toLocaleString()}</span>
                    </div>
                  </div>

                  {payment.status === 'paid' && payment.paid_at && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Paid on {formatDate(payment.paid_at)}
                    </p>
                  )}

                  {payment.status !== 'paid' && !readOnly && (
                    <div className="flex gap-2 pt-0.5">
                      <button
                        onClick={() => handleMarkPaid(payment)}
                        disabled={isLoading}
                        className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Mark as Paid'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
