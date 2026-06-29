'use client'

import React, { useState } from 'react'
import { CheckCircle2, Clock, CalendarDays, ChevronDown } from 'lucide-react'
import { formatDate } from '@/lib/date'

type InstallmentPaymentRow = {
  id: number
  plan_id: number
  installment_number: number
  amount: number
  status: string
  paid_at: string | null
}

type InstallmentPlanRow = {
  id: number
  transaction_id: number | null
  total_amount: number
  num_installments: number
  notes: string | null
  status: string
  created_at: string
  transactions: { id: number; created_at: string; transaction_items: { description: string }[] } | null
  installment_payments: InstallmentPaymentRow[]
}

interface PaymentsClientProps {
  plans: InstallmentPlanRow[]
}


export default function PaymentsClient({ plans }: PaymentsClientProps) {
  const activePlans = plans.filter(p => p.status === 'active')
  const completedPlans = plans.filter(p => p.status === 'completed')

  return (
    <>

      {/* No plans */}
      {plans.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-medium text-slate-500">No installment plans</p>
          <p className="text-xs text-gray-400 mt-1">
            Your clinic will set up an installment plan when applicable.
          </p>
        </div>
      )}

      {/* Active plans */}
      {activePlans.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-800">Active Plans</h2>
          {activePlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </section>
      )}

      {/* Completed plans */}
      {completedPlans.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 mt-2">Completed Plans</h2>
          {completedPlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </section>
      )}
    </>
  )
}

interface PlanCardProps {
  plan: InstallmentPlanRow
}

function PlanCard({ plan }: PlanCardProps) {
  const [expanded, setExpanded] = useState(false)
  const payments = [...plan.installment_payments].sort(
    (a, b) => a.installment_number - b.installment_number
  )
  const txItem = plan.transactions?.transaction_items?.[0]
  const txLabel = txItem?.description ?? (plan.transaction_id ? `Transaction #${plan.transaction_id}` : 'Custom Plan')
  const remainingBalance = payments
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const isCompleted = plan.status === 'completed'

  const summaryLine = isCompleted
    ? `Paid in full — ₱${Number(plan.total_amount).toLocaleString()}`
    : remainingBalance > 0
      ? `Remaining balance: ₱${remainingBalance.toLocaleString()}`
      : 'Fully paid'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/60 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">{txLabel}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Total: ₱{Number(plan.total_amount).toLocaleString()} · {plan.num_installments} installments
          </p>
          <p className={`text-xs mt-1 font-medium ${isCompleted ? 'text-emerald-600' : 'text-slate-700'}`}>
            {summaryLine}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
            plan.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
            plan.status === 'cancelled' ? 'bg-gray-50 text-gray-500 border-gray-200' :
            'bg-blue-50 text-blue-700 border-blue-100'
          }`}>
            {plan.status}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <>
          <div className="divide-y divide-gray-50">
            {payments.map(payment => {
              const isPaid = payment.status === 'paid'
              return (
                <div key={payment.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {isPaid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        Installment {payment.installment_number}
                      </p>
                      {isPaid && payment.paid_at && (
                        <p className="text-xs text-slate-500">
                          Paid {formatDate(payment.paid_at.split('T')[0])}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900 shrink-0">
                    ₱{Number(payment.amount).toLocaleString()}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="px-5 py-4 border-t border-gray-50 bg-slate-50/60 space-y-2">
            {plan.status === 'active' && remainingBalance > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Remaining balance:</span>
                  <span className="text-slate-900 font-bold">₱{remainingBalance.toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-600">
                  Please visit the branch to make a payment.
                </p>
              </>
            )}
            {plan.notes && (
              <p className="text-xs text-slate-500 italic">{plan.notes}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
