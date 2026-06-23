'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, RefreshCw, CalendarDays } from 'lucide-react'
import { createInstallmentPlan } from '@/actions/installmentActions'
import { deriveInstallmentSchedule, getEligibleInstallmentService } from '@/utils/installment-helpers'
import { toDateKey, formatDate } from '@/lib/date'
import type { Transaction } from './types'

interface InstallmentSetupModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
  clinicId: number
  onSuccess: () => void
}

const TODAY = toDateKey()

export default function InstallmentSetupModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}: InstallmentSetupModalProps) {
  const [firstDueDate, setFirstDueDate] = useState(TODAY)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const service = useMemo(() => getEligibleInstallmentService(transaction), [transaction])

  const schedule = useMemo(() => {
    if (!service || service.downpayment_amount == null || service.num_installments == null) return []
    return deriveInstallmentSchedule(
      transaction.total_amount,
      service.downpayment_amount,
      service.num_installments,
      firstDueDate
    )
  }, [service, transaction.total_amount, firstDueDate])

  const handleClose = () => {
    setFormError('')
    setNotes('')
    setFirstDueDate(TODAY)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!service || service.num_installments == null) { setFormError('This transaction has no installment-eligible service.'); return }
    if (!firstDueDate) { setFormError('Select a first due date.'); return }

    setIsSubmitting(true)
    const result = await createInstallmentPlan({
      transaction_id: transaction.id,
      first_due_date: firstDueDate,
      notes: notes || undefined,
    })

    setIsSubmitting(false)
    if (result.success) {
      onSuccess()
      handleClose()
    } else {
      setFormError(result.error || 'Failed to create installment plan.')
    }
  }

  if (!mounted || !isOpen) return null

  const patientName = transaction.patients
    ? `${transaction.patients.first_name} ${transaction.patients.last_name}`
    : 'Unknown Patient'

  return createPortal(
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              Set Up Installment Plan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {patientName} — #TX-{transaction.id} — ₱{Number(transaction.total_amount).toLocaleString()} total
            </p>
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {!service ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm">
              This transaction has no installment-eligible service.
            </div>
          ) : (
            <>
              {/* Plan terms (read-only, set by superadmin per service) */}
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Service</span>
                  <span className="font-medium text-slate-800">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Downpayment</span>
                  <span className="font-medium">₱{Number(service.downpayment_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Installments</span>
                  <span className="font-medium">{service.num_installments} payment{service.num_installments === 1 ? '' : 's'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Monthly amount</span>
                  <span className="font-medium">
                    {service.num_installments && service.num_installments > 0
                      ? `₱${((transaction.total_amount - Number(service.downpayment_amount)) / service.num_installments).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '—'}
                  </span>
                </div>
              </div>

              {/* First due date */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">First Due Date (downpayment)</label>
                <input
                  type="date"
                  required
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />
              </div>

              {/* Derived schedule (read-only) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Payment Schedule</label>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {schedule.map((inst) => (
                    <div key={inst.installment_number} className="grid grid-cols-[28px_1fr_auto] gap-2 items-center text-sm">
                      <span className="text-xs text-slate-400 font-semibold text-right">{inst.installment_number}.</span>
                      <span className="text-slate-600">
                        {formatDate(inst.due_date)}
                        {inst.installment_number === 1 && (
                          <span className="ml-1.5 text-[10px] font-bold text-indigo-600">DOWNPAYMENT</span>
                        )}
                      </span>
                      <span className="font-semibold text-slate-800 text-right">₱{Number(inst.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 pt-1 border-t border-gray-100">
                  <span>Total:</span>
                  <span className="text-emerald-600">₱{Number(transaction.total_amount).toLocaleString()}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Patient agreed to monthly installments starting July..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 resize-none"
                />
              </div>
            </>
          )}

          <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !service}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
