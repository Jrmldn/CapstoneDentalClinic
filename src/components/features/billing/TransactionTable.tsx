'use client'

import { DollarSign, Receipt } from 'lucide-react'
import type { Transaction } from './types'

interface TransactionTableProps {
  filteredTransactions: Transaction[]
  onCollectPayment: (tx: Transaction) => void
}

export default function TransactionTable({ filteredTransactions, onCollectPayment }: TransactionTableProps) {
  return (
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
                      onClick={() => onCollectPayment(tx)}
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
  )
}
