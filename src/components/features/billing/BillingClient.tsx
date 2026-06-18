'use client'

import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { fetchClinicTransactions, PaymentMethod } from '@/actions/billingActions'
import TransactionTable from './TransactionTable'
import CreateInvoiceModal from './CreateInvoiceModal'
import CollectPaymentModal from './CollectPaymentModal'

export interface AppointmentOption {
  id: number
  scheduled_at: string
  downpayment?: number | null
  patients: { id: number; first_name: string; last_name: string } | { id: number; first_name: string; last_name: string }[] | null
  services: { id: number; name: string; price: number } | { id: number; name: string; price: number }[] | null
}

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
  appointments: AppointmentOption[]
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
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [paymentTransaction, setPaymentTransaction] = useState<Transaction | null>(null)

  const refreshTransactions = async () => {
    try {
      const result = await fetchClinicTransactions(clinicId)
      if (result.success) {
        setTransactions(result.transactions as Transaction[])
      }
    } catch {
      // silent refresh failure — UI remains with stale data
    }
  }

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

      <TransactionTable
        filteredTransactions={filteredTransactions}
        onCollectPayment={(tx) => setPaymentTransaction(tx)}
      />

      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        clinicId={clinicId}
        appointments={appointments}
        services={services}
        products={products}
        patients={patients}
        onSuccess={refreshTransactions}
      />

      <CollectPaymentModal
        transaction={paymentTransaction}
        onClose={() => setPaymentTransaction(null)}
        onSuccess={refreshTransactions}
      />
    </div>
  )
}
