'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  Receipt,
  FileText,
  DollarSign,
  AlertCircle,
  X,
  RefreshCw,
  Trash2,
  Calendar,
  CheckCircle,
  Briefcase
} from 'lucide-react'
import {
  createTransaction,
  processPayment,
  fetchClinicTransactions,
  DiscountType,
  PaymentMethod,
  PaymentStatus,
  TransactionItem
} from '@/actions/billingActions'

export interface Patient {
  id: number
  first_name: string
  last_name: string
}

export interface Service {
  id: number
  name: string
  price: number
}

export interface Product {
  id: number
  name: string
  price: number
}

export interface Transaction {
  id: number
  appointment_id?: number | null
  patient_id: number
  clinic_id: number
  subtotal: number
  discount_type: string
  discount_amount: number
  hmo_coverage: number
  philhealth_coverage: number
  total_amount: number
  payment_method: string
  payment_status: string
  created_at: string
  patients: { first_name: string; last_name: string } | null
  transaction_items?: {
    id: number
    description: string
    quantity: number
    unit_price: number
    total_price: number
  }[]
}

interface BillingClientProps {
  clinicId: number
  initialTransactions: Transaction[]
  appointments: any[]
  services: Service[]
  products: Product[]
  patients: Patient[]
}

export default function BillingClient({
  clinicId,
  initialTransactions,
  appointments,
  services,
  products,
  patients
}: BillingClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [paymentTransaction, setPaymentTransaction] = useState<Transaction | null>(null)

  // Invoice Form State
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

  // Process Payment Form State
  const [collectPaymentMethod, setCollectPaymentMethod] = useState<PaymentMethod>('cash')
  const [collectPaymentStatus, setCollectPaymentStatus] = useState<PaymentStatus>('paid')

  // Helpers
  const refreshTransactions = async () => {
    const res = await fetchClinicTransactions(clinicId)
    if (res.success) {
      setTransactions(res.transactions as Transaction[])
    }
  }

  const handleApptChange = (apptIdStr: string) => {
    setSelectedApptId(apptIdStr)
    if (!apptIdStr) {
      setItems([])
      return
    }

    const appt = appointments.find(a => a.id === parseInt(apptIdStr))
    if (appt) {
      setSelectedPatientId(appt.patients?.id?.toString() || '')
      // Auto-add the appointment service as the first item
      if (appt.services) {
        setItems([
          {
            service_id: appt.services.id,
            description: `Dental Service: ${appt.services.name}`,
            quantity: 1,
            unit_price: appt.services.price
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

  // Invoice calculations
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    let discountAmount = 0
    let total = subtotal

    if (discountType === 'senior' || discountType === 'pwd') {
      discountAmount = parseFloat((subtotal * 0.2).toFixed(2))
      total -= discountAmount
    } else if (discountType === 'hmo') {
      const hmoVal = parseFloat(hmoCoverage) || 0
      discountAmount = Math.min(subtotal, hmoVal)
      total -= discountAmount
    } else if (discountType === 'philhealth') {
      const phVal = parseFloat(philhealthCoverage) || 0
      discountAmount = Math.min(subtotal, phVal)
      total -= discountAmount
    }

    return {
      subtotal,
      discountAmount,
      total: Math.max(0, total)
    }
  };

  const totals = calculateTotals()

  // Submit Invoice Creation
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
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
    const res = await createTransaction({
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
    if (res.success) {
      alert('Invoice created successfully!')
      setIsInvoiceModalOpen(false)
      // Reset form
      setSelectedApptId('')
      setSelectedPatientId('')
      setItems([])
      setDiscountType('none')
      setHmoCoverage('0')
      setPhilhealthCoverage('0')
      setPaymentMethod('cash')
      setPaymentStatus('paid')
      refreshTransactions()
    } else {
      setFormError(res.error || 'Failed to create invoice')
    }
  }

  // Collect Payment Action
  const handleCollectPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentTransaction) return
    setIsSubmitting(true)

    const res = await processPayment(
      paymentTransaction.id,
      collectPaymentMethod,
      collectPaymentStatus
    )

    setIsSubmitting(false)
    if (res.success) {
      alert('Payment collected and recorded!')
      setPaymentTransaction(null)
      refreshTransactions()
    } else {
      alert(res.error || 'Failed to process payment')
    }
  }

  // Filters
  const filteredTransactions = transactions.filter(tx => {
    const patientName = `${tx.patients?.first_name || ''} ${tx.patients?.last_name || ''}`.toLowerCase()
    const matchesSearch = patientName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tx.payment_status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient name..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        <button
          onClick={() => setIsInvoiceModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Subtotal</th>
                <th className="px-6 py-4">Discounts</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">
                    #TX-{tx.id}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {tx.patients ? `${tx.patients.first_name} ${tx.patients.last_name}` : 'Unknown Patient'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(tx.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 font-medium">₱{Number(tx.subtotal).toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs text-indigo-600 font-medium">
                    {tx.discount_amount > 0 ? `- ₱${Number(tx.discount_amount).toLocaleString()} (${tx.discount_type})` : '—'}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">₱{Number(tx.total_amount).toLocaleString()}</td>
                  <td className="px-6 py-4 capitalize text-gray-500">{tx.payment_method}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      tx.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      tx.payment_status === 'partial' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {tx.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {tx.payment_status !== 'paid' && (
                      <button
                        onClick={() => {
                          setPaymentTransaction(tx)
                          setCollectPaymentMethod(tx.payment_method as PaymentMethod)
                          setCollectPaymentStatus('paid')
                        }}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-bold transition flex items-center gap-1 inline-flex"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Collect Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-20 text-gray-400">
                    <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="font-medium text-slate-500">No transactions recorded</p>
                    <p className="text-xs text-gray-400 mt-1">Try resetting your search query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create Invoice */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                Create New Billing Invoice
              </h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleInvoiceSubmit} className="p-6 space-y-6 flex-1">
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
                      const patientName = a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : 'Unknown'
                      const dateStr = new Date(a.scheduled_at).toLocaleDateString()
                      return (
                        <option key={a.id} value={a.id}>
                          {patientName} - {dateStr} ({a.services?.name ?? 'No service'})
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
                    onChange={e => setDiscountType(e.target.value as any)}
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
                    onChange={e => setPaymentMethod(e.target.value as any)}
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
                    onChange={e => setPaymentStatus(e.target.value as any)}
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
                  onClick={() => setIsInvoiceModalOpen(false)}
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
      )}

      {/* MODAL: Collect Payment */}
      {paymentTransaction && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-900 text-sm">Collect Payment</h3>
              <button onClick={() => setPaymentTransaction(null)} className="p-1 hover:bg-gray-200 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCollectPaymentSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-150 p-4 rounded-xl text-xs text-blue-800 space-y-2">
                <p><strong>Patient:</strong> {paymentTransaction.patients ? `${paymentTransaction.patients.first_name} ${paymentTransaction.patients.last_name}` : 'Unknown'}</p>
                <p><strong>Total Amount Due:</strong> ₱{Number(paymentTransaction.total_amount).toLocaleString()}</p>
                <p><strong>Current Status:</strong> <span className="uppercase font-bold">{paymentTransaction.payment_status}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Payment Method</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                    value={collectPaymentMethod}
                    onChange={e => setCollectPaymentMethod(e.target.value as any)}
                  >
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="paymaya">PayMaya</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="hmo">HMO</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-650 block">New Status</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                    value={collectPaymentStatus}
                    onChange={e => setCollectPaymentStatus(e.target.value as any)}
                  >
                    <option value="paid">Fully Paid</option>
                    <option value="partial">Partially Paid</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentTransaction(null)}
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
      )}
    </div>
  )
}
