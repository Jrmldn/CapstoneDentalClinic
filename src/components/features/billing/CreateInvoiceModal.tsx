'use client'

import { useState } from 'react'
import {
  Receipt,
  AlertCircle,
  X,
  RefreshCw,
  Trash2
} from 'lucide-react'
import {
  createTransaction,
  fetchClinicTransactions,
  DiscountType,
  PaymentMethod,
  PaymentStatus,
  TransactionItem
} from '@/actions/billingActions'
import { AppointmentOption, Service, Product, Patient, Transaction } from './BillingClient'

const SENIOR_PWD_DISCOUNT_RATE = 0.2

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  clinicId: number
  appointments: AppointmentOption[]
  services: Service[]
  products: Product[]
  patients: Patient[]
  onSuccess: () => void
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  clinicId,
  appointments,
  services,
  products,
  patients,
  onSuccess
}: CreateInvoiceModalProps) {
  const [selectedApptId, setSelectedApptId] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [items, setItems] = useState<TransactionItem[]>([])
  const [discountType, setDiscountType] = useState<DiscountType>('none')
  const [hmoCoverage, setHmoCoverage] = useState('0')
  const [philhealthCoverage, setPhilhealthCoverage] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleApptChange = (apptIdStr: string) => {
    setSelectedApptId(apptIdStr)
    if (!apptIdStr) {
      setItems([])
      return
    }

    const appointment = appointments.find(a => a.id === parseInt(apptIdStr))
    if (appointment) {
      const patientObj = Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients
      const serviceObj = Array.isArray(appointment.services) ? appointment.services[0] : appointment.services

      setSelectedPatientId(patientObj?.id?.toString() || '')
      if (serviceObj) {
        setItems([
          {
            service_id: serviceObj.id,
            description: `Dental Service: ${serviceObj.name}`,
            quantity: 1,
            unit_price: serviceObj.price
          }
        ])
      }
    }
  }

  const handleAddItem = (type: 'service' | 'product', itemIdStr: string) => {
    if (!itemIdStr) return
    const id = parseInt(itemIdStr)

    if (type === 'service') {
      const svc = services.find(s => s.id === id)
      if (svc) {
        setItems(prev => [
          ...prev,
          {
            service_id: svc.id,
            description: `Dental Service: ${svc.name}`,
            quantity: 1,
            unit_price: svc.price
          }
        ])
      }
    } else {
      const prod = products.find(p => p.id === id)
      if (prod) {
        setItems(prev => [
          ...prev,
          {
            product_id: prod.id,
            description: `Product: ${prod.name}`,
            quantity: 1,
            unit_price: prod.price
          }
        ])
      }
    }
  }

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleQuantityChange = (index: number, qty: number) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, qty) } : item))
    )
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    let discountAmount = 0
    let total = subtotal

    if (discountType === 'senior' || discountType === 'pwd') {
      discountAmount = parseFloat((subtotal * SENIOR_PWD_DISCOUNT_RATE).toFixed(2))
      total -= discountAmount
    } else if (discountType === 'hmo') {
      const hmoCoverageAmount = parseFloat(hmoCoverage) || 0
      discountAmount = Math.min(subtotal, hmoCoverageAmount)
      total -= discountAmount
    } else if (discountType === 'philhealth') {
      const philhealthCoverageAmount = parseFloat(philhealthCoverage) || 0
      discountAmount = Math.min(subtotal, philhealthCoverageAmount)
      total -= discountAmount
    }

    return {
      subtotal,
      discountAmount,
      total: Math.max(0, total)
    }
  }

  const totals = calculateTotals()

  const resetForm = () => {
    setSelectedApptId('')
    setSelectedPatientId('')
    setItems([])
    setDiscountType('none')
    setHmoCoverage('0')
    setPhilhealthCoverage('0')
    setPaymentMethod('cash')
    setPaymentStatus('paid')
    setFormError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (items.length === 0) {
      setFormError('Please add at least one item to the invoice.')
      return
    }
    if (!selectedPatientId) {
      setFormError('Please select a patient.')
      return
    }

    setIsSubmitting(true)
    const result = await createTransaction({
      appointment_id: parseInt(selectedApptId),
      patient_id: parseInt(selectedPatientId),
      clinic_id: clinicId,
      items,
      discount_type: discountType,
      hmo_coverage: parseFloat(hmoCoverage) || 0,
      philhealth_coverage: parseFloat(philhealthCoverage) || 0,
      payment_method: paymentMethod,
      payment_status: paymentStatus
    })

    setIsSubmitting(false)
    if (result.success) {
      alert('Invoice created successfully!')
      resetForm()
      onClose()
      onSuccess()
    } else {
      setFormError(result.error || 'Failed to create invoice')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Create New Billing Invoice
          </h3>
          <button onClick={handleClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Patient and Appointment setup */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">Linked Appointment (Optional)</label>
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 text-slate-700"
                value={selectedApptId}
                onChange={(e) => handleApptChange(e.target.value)}
              >
                <option value="">-- No Appointment (Custom Invoice) --</option>
                {appointments.map(a => {
                  const patientObj = Array.isArray(a.patients) ? a.patients[0] : a.patients
                  const serviceObj = Array.isArray(a.services) ? a.services[0] : a.services
                  const patientName = patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : 'Unknown'
                  const dateStr = new Date(a.scheduled_at).toLocaleDateString()
                  return (
                    <option key={a.id} value={a.id}>
                      {patientName} - {dateStr} ({serviceObj?.name ?? 'No service'})
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">Select Patient *</label>
              <select
                required
                disabled={!!selectedApptId}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 text-slate-700 disabled:opacity-60"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">-- Select Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.last_name}, {p.first_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add items to invoice */}
          <div className="border-t border-gray-150 pt-4 space-y-4">
            <div className="flex gap-4 items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">Line Items</h4>
              <div className="flex gap-2">
                <select
                  className="px-3 py-1.5 bg-gray-55 border border-gray-200 rounded-lg text-xs outline-none"
                  onChange={(e) => {
                    handleAddItem('service', e.target.value)
                    e.target.value = ''
                  }}
                >
                  <option value="">+ Add Service</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (₱{s.price})</option>
                  ))}
                </select>

                <select
                  className="px-3 py-1.5 bg-gray-55 border border-gray-200 rounded-lg text-xs outline-none"
                  onChange={(e) => {
                    handleAddItem('product', e.target.value)
                    e.target.value = ''
                  }}
                >
                  <option value="">+ Add Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (₱{p.price})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-100 rounded-lg overflow-hidden bg-slate-50">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 text-slate-500 font-bold border-b border-gray-200">
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2 w-20">Qty</th>
                    <th className="px-4 py-2">Unit Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-right w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-slate-700">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2.5 font-medium">{item.description}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min="1"
                          className="w-16 px-2 py-1 bg-white border border-gray-200 rounded outline-none text-center font-semibold"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-2.5">₱{item.unit_price.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-bold">
                        ₱{(item.unit_price * item.quantity).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-400">
                        No items added. Select an appointment or add services/products.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discount Setup */}
          <div className="grid grid-cols-2 gap-4 border-t border-gray-150 pt-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Apply Discount</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                value={discountType}
                onChange={e => setDiscountType(e.target.value as DiscountType)}
              >
                <option value="none">No Discount</option>
                <option value="senior">Senior Citizen (20%)</option>
                <option value="pwd">PWD (20%)</option>
                <option value="hmo">HMO Coverage</option>
                <option value="philhealth">PhilHealth Coverage</option>
              </select>
            </div>

            {discountType === 'hmo' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-650 block">HMO Covered Amount (₱)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                  value={hmoCoverage}
                  onChange={e => setHmoCoverage(e.target.value)}
                />
              </div>
            )}

            {discountType === 'philhealth' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-650 block">PhilHealth Deductible (₱)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                  value={philhealthCoverage}
                  onChange={e => setPhilhealthCoverage(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Payment Method</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
                <option value="paymaya">PayMaya</option>
                <option value="credit_card">Credit Card</option>
                <option value="hmo">HMO</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Payment Status</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
              >
                <option value="paid">Fully Paid</option>
                <option value="partial">Partially Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 text-xs font-semibold text-slate-700 space-y-2.5">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₱{totals.subtotal.toLocaleString()}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-indigo-600">
                <span>Discount / Coverages:</span>
                <span>- ₱{totals.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-slate-900">
              <span>Total Payable:</span>
              <span>₱{totals.total.toLocaleString()}</span>
            </div>
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
              disabled={isSubmitting || items.length === 0}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
