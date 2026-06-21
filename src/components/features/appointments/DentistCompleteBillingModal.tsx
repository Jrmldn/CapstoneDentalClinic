'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, RefreshCw, FileText, Plus, Trash2 } from 'lucide-react'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import { createDraftInvoice } from '@/actions/billingActions'
import { toothInputToNumber } from '@/utils/teeth'
import type { Appointment } from '@/components/features/dashboard/DentistDashboardView'
import type { Service } from '@/components/features/billing/types'

interface DentistCompleteBillingModalProps {
  appointment: Appointment | null
  onClose: () => void
  clinicId: number
  dentistUserId: string
  dentistId: number
  services: Service[]
  onSuccess: () => void
}

interface DraftLine {
  service_id: number | ''
  description: string
  unit_price: number
  tooth_number: string
  notes: string
}

const blankLine = (): DraftLine => ({
  service_id: '',
  description: '',
  unit_price: 0,
  tooth_number: '',
  notes: '',
})

export default function DentistCompleteBillingModal({
  appointment,
  onClose,
  clinicId,
  dentistUserId,
  dentistId,
  services,
  onSuccess,
}: DentistCompleteBillingModalProps) {
  const [lines, setLines] = useState<DraftLine[]>([blankLine()])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Seed the first line from the appointment's booked service when present.
  useEffect(() => {
    if (appointment?.services) {
      setLines([{
        service_id: appointment.services.id,
        description: appointment.services.name,
        unit_price: appointment.services.price,
        tooth_number: '',
        notes: '',
      }])
    } else {
      setLines([blankLine()])
    }
    setErrorMsg(null)
  }, [appointment])

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines(prev => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  const handleServiceChange = (index: number, rawId: string) => {
    if (!rawId) {
      updateLine(index, { service_id: '', description: '', unit_price: 0 })
      return
    }
    const id = Number(rawId)
    const service = services.find(s => s.id === id)
    updateLine(index, {
      service_id: id,
      description: service?.name ?? '',
      unit_price: service?.price ?? service?.price_min ?? 0,
    })
  }

  const addLine = () => setLines(prev => [...prev, blankLine()])

  const removeLine = (index: number) => {
    setLines(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  const subtotal = lines.reduce((sum, line) => sum + (Number(line.unit_price) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment || !appointment.patients) return

    const validLines = lines.filter(line => line.service_id !== '')
    if (validLines.length === 0) {
      setErrorMsg('Add at least one treatment line with a selected service.')
      return
    }
    if (validLines.some(line => Number(line.unit_price) < 0)) {
      setErrorMsg('Fees cannot be negative.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    const completionResult = await updateAppointmentStatus(
      appointment.id,
      'completed',
      dentistUserId,
      'dentist',
      'Completed and sent to billing'
    )
    if (!completionResult.success) {
      setErrorMsg(completionResult.error || 'Failed to mark appointment as completed')
      setIsSubmitting(false)
      return
    }

    const draftResult = await createDraftInvoice({
      appointment_id: appointment.id,
      patient_id: appointment.patients.id,
      clinic_id: clinicId,
      dentist_id: dentistId,
      items: validLines.map(line => ({
        service_id: Number(line.service_id),
        description: line.description,
        quantity: 1,
        unit_price: Number(line.unit_price) || 0,
        tooth_number: toothInputToNumber(line.tooth_number),
        treatment_notes: line.notes || null,
      })),
    })

    setIsSubmitting(false)
    if (draftResult.success) {
      onSuccess()
    } else {
      setErrorMsg(draftResult.error || 'Failed to create draft invoice')
    }
  }

  if (!mounted || !appointment) return null

  const patient = appointment.patients

  return createPortal(
    <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Complete &amp; Send to Billing
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <p className="text-sm text-slate-700">
            <strong>Patient:</strong> {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'}
          </p>

          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Service</label>
                    <select
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500"
                      value={line.service_id}
                      onChange={(e) => handleServiceChange(index, e.target.value)}
                    >
                      <option value="">Select a service…</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tooth</label>
                    <input
                      type="text"
                      placeholder="26 / A"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500"
                      value={line.tooth_number}
                      onChange={(e) => updateLine(index, { tooth_number: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Fee (₱)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none text-right font-semibold focus:ring-1 focus:ring-blue-500"
                      value={line.unit_price}
                      onChange={(e) => updateLine(index, { unit_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    disabled={lines.length === 1}
                    className="mt-5 p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 transition"
                    title="Remove line"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Clinical note for this treatment…"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    value={line.notes}
                    onChange={(e) => updateLine(index, { notes: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add treatment line
          </button>

          <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-1.5 text-sm">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span>Subtotal</span>
              <span>₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            {appointment.downpayment > 0 && (
              <>
                <p className="flex justify-between text-xs text-gray-400">
                  <span>Downpayment on file:</span>
                  <span>₱{appointment.downpayment.toLocaleString()}</span>
                </p>
                <p className="text-[11px] text-gray-400 italic">Downpayment will be deducted by staff at checkout.</p>
              </>
            )}
          </div>

          <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            A draft invoice will be sent to the clinic assistant for final payment collection and discounts.
          </p>

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
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Complete & Send to Billing'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
