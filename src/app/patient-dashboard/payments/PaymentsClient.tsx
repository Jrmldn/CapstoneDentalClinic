'use client'

import React, { useState } from 'react'
import { CheckCircle2, AlertTriangle, Clock, CalendarDays, Info } from 'lucide-react'
import PaymentModal from '@/components/features/billing/PaymentModal'

const TODAY = new Date().toISOString().split('T')[0]

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / 86400000)
}

type InstallmentPaymentRow = {
  id: number
  plan_id: number
  installment_number: number
  due_date: string
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
  patientId: number
}

type PaymentTarget = {
  installmentPaymentId: number
  planId: number
  amount: number
  description: string
}

function getPaymentBadge(payment: InstallmentPaymentRow) {
  if (payment.status === 'paid') return { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
  if (payment.status === 'overdue' || payment.due_date < TODAY) return { label: 'Overdue', cls: 'bg-red-50 text-red-700 border-red-100' }
  const d = daysUntil(payment.due_date)
  if (d <= 3) return { label: `Due in ${d}d`, cls: 'bg-amber-50 text-amber-700 border-amber-100' }
  return { label: 'Pending', cls: 'bg-blue-50 text-blue-700 border-blue-100' }
}

export default function PaymentsClient({ plans, patientId }: PaymentsClientProps) {
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null)
  const [paidIds, setPaidIds] = useState<Set<number>>(new Set())

  const nearDue: { planId: number; installmentNum: number; dueDate: string }[] = []
  const overdue: { planId: number; installmentNum: number; dueDate: string }[] = []

  for (const plan of plans) {
    if (plan.status !== 'active') continue
    for (const p of plan.installment_payments) {
      if (p.status === 'paid' || paidIds.has(p.id)) continue
      if (p.due_date < TODAY || p.status === 'overdue') {
        overdue.push({ planId: plan.id, installmentNum: p.installment_number, dueDate: p.due_date })
      } else {
        const d = daysUntil(p.due_date)
        if (d <= 3) nearDue.push({ planId: plan.id, installmentNum: p.installment_number, dueDate: p.due_date })
      }
    }
  }

  const activePlans = plans.filter(p => p.status === 'active')
  const completedPlans = plans.filter(p => p.status === 'completed')

  return (
    <>
      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              {overdue.length} installment{overdue.length > 1 ? 's are' : ' is'} overdue.
            </p>
            <p className="text-red-700 text-xs mt-0.5">
              Please settle your overdue payment{overdue.length > 1 ? 's' : ''} as soon as possible.
            </p>
          </div>
        </div>
      )}

      {/* Near-due alert */}
      {nearDue.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              {nearDue.length} installment{nearDue.length > 1 ? 's are' : ' is'} due within 3 days.
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              {nearDue.map(n => `Installment ${n.installmentNum} — due ${formatDate(n.dueDate)}`).join(' · ')}
            </p>
          </div>
        </div>
      )}

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
            <PlanCard
              key={plan.id}
              plan={plan}
              paidIds={paidIds}
              onPay={(payment) => {
                const txItem = plan.transactions?.transaction_items?.[0]
                const txLabel = txItem?.description ?? (plan.transaction_id ? `Transaction #${plan.transaction_id}` : 'Installment Plan')
                setPaymentTarget({
                  installmentPaymentId: payment.id,
                  planId: plan.id,
                  amount: payment.amount,
                  description: `${txLabel} — Installment ${payment.installment_number}`,
                })
              }}
            />
          ))}
        </section>
      )}

      {/* Completed plans */}
      {completedPlans.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 mt-2">Completed Plans</h2>
          {completedPlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} paidIds={paidIds} onPay={null} />
          ))}
        </section>
      )}

      {paymentTarget && (
        <PaymentModal
          isOpen
          onClose={() => setPaymentTarget(null)}
          amount={paymentTarget.amount}
          description={paymentTarget.description}
          contextType="installment_payment"
          contextId={paymentTarget.installmentPaymentId}
          patientId={patientId}
          onSuccess={() => {
            setPaidIds(prev => new Set(prev).add(paymentTarget.installmentPaymentId))
            setPaymentTarget(null)
          }}
        />
      )}
    </>
  )
}

interface PlanCardProps {
  plan: InstallmentPlanRow
  paidIds: Set<number>
  onPay: ((payment: InstallmentPaymentRow) => void) | null
}

function PlanCard({ plan, paidIds, onPay }: PlanCardProps) {
  const payments = [...plan.installment_payments].sort(
    (a, b) => a.installment_number - b.installment_number
  )
  const txItem = plan.transactions?.transaction_items?.[0]
  const txLabel = txItem?.description ?? (plan.transaction_id ? `Transaction #${plan.transaction_id}` : 'Custom Plan')

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/60">
        <div>
          <p className="text-sm font-bold text-slate-800">{txLabel}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Total: ₱{Number(plan.total_amount).toLocaleString()} ·{' '}
            {plan.num_installments} installments
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
          plan.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
          plan.status === 'cancelled' ? 'bg-gray-50 text-gray-500 border-gray-200' :
          'bg-blue-50 text-blue-700 border-blue-100'
        }`}>
          {plan.status}
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {payments.map(payment => {
          const isOptimisticallyPaid = paidIds.has(payment.id)
          const effectiveStatus = isOptimisticallyPaid ? 'paid' : payment.status
          const effectivePaid = isOptimisticallyPaid || payment.status === 'paid'
          const isOverdue = effectiveStatus === 'overdue' || (effectiveStatus !== 'paid' && payment.due_date < TODAY)
          const badge = isOptimisticallyPaid
            ? { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
            : getPaymentBadge(payment)

          return (
            <div key={payment.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {effectivePaid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : isOverdue ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    Installment {payment.installment_number}
                  </p>
                  <p className="text-xs text-slate-500">
                    Due: {formatDate(payment.due_date)}
                    {payment.status === 'paid' && payment.paid_at &&
                      ` · Paid ${formatDate(payment.paid_at.split('T')[0])}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    ₱{Number(payment.amount).toLocaleString()}
                  </p>
                </div>
                {!effectivePaid && onPay ? (
                  <button
                    onClick={() => onPay(payment)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition whitespace-nowrap"
                  >
                    Pay Now
                  </button>
                ) : (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${badge.cls}`}>
                    {badge.label}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {plan.notes && (
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
          <p className="text-xs text-slate-500 italic">{plan.notes}</p>
        </div>
      )}
    </div>
  )
}
