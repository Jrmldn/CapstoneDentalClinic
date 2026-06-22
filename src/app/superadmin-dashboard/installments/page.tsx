import { enforceRole } from '@/lib/auth/protection'
import { getClinics } from '@/lib/queries/clinics'
import { fetchAllInstallments } from '@/actions/installmentActions'
import SuperadminInstallmentsClient from '@/components/features/billing/SuperadminInstallmentsClient'
import type { InstallmentPlan } from '@/components/features/billing/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Installment Plans — Superadmin Portal' }

export default async function SuperadminInstallmentsPage() {
  await enforceRole('superadmin')

  const [plansRes, clinicsRes] = await Promise.all([
    fetchAllInstallments(),
    getClinics(),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Installment Plans</h1>
        <p className="text-sm text-gray-500 mt-1">
          View all installment plans across every clinic and branch.
        </p>
      </div>

      <SuperadminInstallmentsClient
        initialPlans={plansRes.plans as InstallmentPlan[]}
        clinicOptions={clinicsRes.data}
      />
    </div>
  )
}
