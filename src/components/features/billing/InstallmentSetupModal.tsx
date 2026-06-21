'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, RefreshCw, CalendarDays, Plus, Minus } from 'lucide-react'
import { createInstallmentPlan } from '@/actions/installmentActions'
import type { Transaction } from './types'

interface InstallmentSetupModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
  clinicId: number
  onSuccess: () => void
}

function splitEvenly(total: number, n: number) {
  const base = Math.floor((total / n) * 100) / 100
  const remainder = parseFloat((total - base * n).toFixed(2))
  return Array.from({ length: n }, (_, i) => ({
    due_date: '',
    amount: i === n - 1 ? (base + remainder).toFixed(2) : base.toFixed(2),
  }))
}

export default function InstallmentSetupModal({
  isOpen,
  onClose,
  transaction,
  clinicId,
  onSuccess,
}: InstallmentSetupModalProps) {
  const [numInstallments, setNumInstallments] = useState(2)
  const [penaltyType, setPenaltyType] = useState<'flat' | 'percentage'>('flat')
  const [penaltyValue, setPenaltyValue] = useState('0')
  const [notes, setNotes] = useState('')
  const [installments, setInstallments] = useState<{ due_date: string; amount: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const resetSplit = useCallback(() => {
    setInstallments(splitEvenly(transaction.total_amount, numInstallments))
  }, [transaction.total_amount, numInstallments])

  useEffect(() => { resetSplit() }, [resetSplit])

  const totalInstallmentAmount = installments.reduce(
    (sum, inst) => sum + (parseFloat(inst.amount) || 0),
    0
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    for (const inst of installments) {
      if (!inst.due_date) { setFormError('All installments must have a due date.'); return }
      if (!inst.amount || parseFloat(inst.amount) <= 0) { setFormError('All installments must have a valid amount.'); return }
    }

    if (Math.abs(totalInstallmentAmount - transaction.total_amount) > 0.05) {
      setFormError(
        `Installment total ₱${totalInstallmentAmount.toLocaleString()} doesn't match transaction total ₱${Number(transaction.total_amount).toLocaleString()}.`
      )
      return
    }

    setIsSubmitting(true)
    const result = await createInstallmentPlan({
      transaction_id: transaction.id,
      clinic_id: clinicId,
      patient_id: transaction.patient_id,
      total_amount: transaction.total_amount,
      installments: installments.map(inst => ({
        due_date: inst.due_date,
        amount: parseFloat(inst.amount),
      })),
      penalty_type: penaltyType,
      penalty_value: parseFloat(penaltyValue) || 0,
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

  const handleClose = () => {
    setFormError('')
    setNotes('')
    setPenaltyType('flat')
    setPenaltyValue('0')
    setNumInstallments(2)
    onClose()
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

          {/* Number of installments */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Number of Installments</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNumInstallments(n => Math.max(2, n - 1))}
                disabled={numInstallments <= 2}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-bold text-slate-900 w-6 text-center">{numInstallments}</span>
              <button
                type="button"
                onClick={() => setNumInstallments(n => Math.min(5, n + 1))}
                disabled={numInstallments >= 5}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400">installments (2–5)</span>
            </div>
          </div>

          {/* Schedule table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Payment Schedule</label>
              <button
                type="button"
                onClick={resetSplit}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Reset equal split
              </button>
            </div>
            <div className="space-y-2">
              {installments.map((inst, i) => (
                <div key={i} className="grid grid-cols-[28px_1fr_1fr] gap-2 items-center">
                  <span className="text-xs text-slate-400 font-semibold text-right">{i + 1}.</span>
                  <input
                    type="date"
                    required
                    value={inst.due_date}
                    onChange={(e) =>
                      setInstallments(prev =>
                        prev.map((p, idx) => idx === i ? { ...p, due_date: e.target.value } : p)
                      )
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">₱</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={inst.amount}
                      onChange={(e) =>
                        setInstallments(prev =>
                          prev.map((p, idx) => idx === i ? { ...p, amount: e.target.value } : p)
                        )
                      }
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-500 pt-1 border-t border-gray-100">
              <span>Total:</span>
              <span className={
                Math.abs(totalInstallmentAmount - transaction.total_amount) > 0.05
                  ? 'text-red-600'
                  : 'text-emerald-600'
              }>
                ₱{totalInstallmentAmount.toLocaleString()} / ₱{Number(transaction.total_amount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Penalty settings */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <label className="text-sm font-semibold text-slate-700 block">Late Payment Penalty</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Penalty Type</label>
                <select
                  value={penaltyType}
                  onChange={(e) => setPenaltyType(e.target.value as 'flat' | 'percentage')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                >
                  <option value="flat">Flat Amount (₱)</option>
                  <option value="percentage">Interest Rate (%)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  {penaltyType === 'flat' ? 'Amount (₱)' : 'Rate (%)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step={penaltyType === 'percentage' ? '0.1' : '1'}
                  value={penaltyValue}
                  onChange={(e) => setPenaltyValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {penaltyType === 'flat'
                ? `₱${parseFloat(penaltyValue) || 0} added per overdue installment.`
                : `${parseFloat(penaltyValue) || 0}% of installment amount added when overdue.`}
            </p>
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
              disabled={isSubmitting}
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
