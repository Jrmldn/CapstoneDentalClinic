import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import { fetchClinicTransactions } from '@/actions/billingActions'
import { fetchClinicInstallments } from '@/actions/installmentActions'
import StaffTransactionsClient from './StaffTransactionsClient'
import type { Transaction, InstallmentPlan } from '@/components/features/billing/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Transactions — AppoinDent' }

export default async function StaffTransactionsPage() {
  const authUser = await enforceRole('staff')

  const clinicId = await getStaffClinicId(authUser.id)
  if (!clinicId) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact a superadmin.
      </div>
    )
  }

  const [txRes, plansRes] = await Promise.all([
    fetchClinicTransactions(clinicId),
    fetchClinicInstallments(clinicId),
  ])
  const allTransactions = (txRes.transactions ?? []) as Transaction[]
  const installmentPlans = (plansRes.plans ?? []) as InstallmentPlan[]
  const planTxIds = new Set(installmentPlans.map(p => p.transaction_id).filter(Boolean))
  const transactions = allTransactions.filter(tx =>
    tx.billing_status !== 'draft' &&
    (tx.payment_status === 'paid' || tx.payment_status === 'partial' || planTxIds.has(tx.id))
  )

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Issued and paid invoices. Use Billing for pending action items.
        </p>
      </div>
      <StaffTransactionsClient transactions={transactions} installmentPlans={installmentPlans} />
    </div>
  )
}
