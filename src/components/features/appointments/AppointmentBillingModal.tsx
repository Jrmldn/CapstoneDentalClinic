'use client'

import { useState } from 'react'
import { X, RefreshCw, FileText } from 'lucide-react'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import { createTransaction } from '@/actions/billingActions'
import type { Appointment } from './AppointmentTypes'

interface AppointmentBillingModalProps {
  appointment: Appointment | null
  onClose: () => void
  userId: string
  clinicId: number
  onSuccess: () => void
}

export default function AppointmentBillingModal({
  appointment,
  onClose,
  userId,
  clinicId,
  onSuccess
}: AppointmentBillingModalProps) {
  const [discountType, setDiscountType] = useState<'none' | 'senior' | 'pwd' | 'hmo' | 'philhealth'>('none')
  const [hmoCoverage, setHmoCoverage] = useState('0')
  const [philhealthCoverage, setPhilhealthCoverage] = useState('0')
  const [billingPaymentMethod, setBillingPaymentMethod] = useState<'cash' | 'gcash' | 'credit_card' | 'paymaya' | 'hmo'>('cash')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCompleteAndInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment || !appointment.services || !appointment.patients) return
    setIsSubmitting(true)

    // 1. Mark appointment as completed
    const completionResult = await updateAppointmentStatus(
      appointment.id,
      'completed',
      userId,
      'staff',
      'Completed and billed'
    )

    if (!completionResult.success) {
      alert('Failed to update appointment to Completed')
      setIsSubmitting(false)
      return
    }

    // 2. Create Transaction Invoice
    const service = appointment.services
    const items = [
      {
        service_id: service.id,
        description: `Dental Service: ${service.name}`,
        quantity: 1,
        unit_price: service.price
      }
    ]

    const transactionResult = await createTransaction({
      appointment_id: appointment.id,
      patient_id: appointment.patients.id,
      clinic_id: clinicId,
      items,
      discount_type: discountType,
      hmo_coverage: parseFloat(hmoCoverage) || 0,
      philhealth_coverage: parseFloat(philhealthCoverage) || 0,
      payment_method: billingPaymentMethod,
      payment_status: billingPaymentMethod === 'hmo' ? 'partial' : 'paid'
    })

    setIsSubmitting(false)
    if (transactionResult.success) {
      alert('Appointment completed and invoice created successfully!')
      onSuccess()
    } else {
      alert(transactionResult.error || 'Failed to create transaction invoice')
    }
  }

  if (!appointment) return null

  return (
    <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Generate Invoice &amp; Complete
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleCompleteAndInvoice} className="p-6 space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2 text-sm text-slate-700">
            <p><strong>Patient:</strong> {appointment.patients ? `${appointment.patients.first_name} ${appointment.patients.last_name}` : 'Unknown'}</p>
            <p><strong>Treatment / Service:</strong> {appointment.services?.name}</p>
            <p className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-slate-900">
              <span>Service Fee:</span>
              <span>₱{appointment.services?.price.toLocaleString()}</span>
            </p>
            {appointment.downpayment > 0 && (
              <p className="flex justify-between text-xs text-indigo-650 font-medium">
                <span>Downpayment paid:</span>
                <span>- ₱{appointment.downpayment.toLocaleString()}</span>
              </p>
            )}
          </div>

          {/* Discount selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Apply Discount</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                value={discountType}
                onChange={e => setDiscountType(e.target.value as any)}
              >
                <option value="none">No Discount</option>
                <option value="senior">Senior Citizen (20%)/PWD</option>
                <option value="pwd">PWD (20%)</option>
                <option value="hmo">HMO Coverage</option>
                <option value="philhealth">PhilHealth Coverage</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-650 block">Payment Method</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                value={billingPaymentMethod}
                onChange={e => setBillingPaymentMethod(e.target.value as any)}
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
                <option value="paymaya">PayMaya</option>
                <option value="credit_card">Credit Card</option>
                <option value="hmo">HMO Billout</option>
              </select>
            </div>
          </div>

          {discountType === 'hmo' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">HMO Covered Amount (₱)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="Enter amount"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                value={hmoCoverage}
                onChange={e => setHmoCoverage(e.target.value)}
              />
            </div>
          )}

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
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Record Payment & Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
