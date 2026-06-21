import { supabaseAdmin } from '@/lib/supabase/server'
import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import { fetchClinicTransactions } from '@/actions/billingActions'
import BillingClient from '@/components/features/billing/BillingClient'

export const metadata = { title: 'Billing & Invoices — AppoinDent' }

export default async function BillingPage() {
  const authUser = await enforceRole('staff')

  const clinicId = await getStaffClinicId(authUser.id)
  if (!clinicId) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact a superadmin.
      </div>
    )
  }

  const [txRes, appointmentsRes, servicesRes, productsRes, patientsRes, installmentPlansRes] =
    await Promise.all([
      fetchClinicTransactions(clinicId),
      supabaseAdmin
        .from('appointments')
        .select(`
          id, scheduled_at, status, payment_status, downpayment,
          patients ( id, first_name, last_name ),
          services ( id, name, price )
        `)
        .eq('clinic_id', clinicId)
        .not('status', 'in', '(cancelled,no_show)')
        .order('scheduled_at', { ascending: false }),
      supabaseAdmin
        .from('services')
        .select('id, name, price, price_min, price_max')
        .eq('clinic_id', clinicId)
        .eq('is_active', true),
      supabaseAdmin
        .from('products')
        .select('id, name, price, price_min, price_max')
        .eq('clinic_id', clinicId)
        .eq('is_active', true),
      supabaseAdmin
        .from('patients')
        .select('id, first_name, last_name')
        .eq('is_guest', false),
      supabaseAdmin
        .from('installment_plans')
        .select(`
          id, transaction_id, clinic_id, patient_id, total_amount, num_installments,
          penalty_type, penalty_value, notes, status, created_at,
          patients ( id, first_name, last_name ),
          installment_payments (
            id, plan_id, installment_number, due_date, amount, penalty_amount, status, paid_at, created_at
          )
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false }),
    ])

  const initialTransactions = txRes.transactions || []

  const activePatients = (patientsRes.data || []).sort((a: { first_name: string; last_name: string }, b: { first_name: string; last_name: string }) => {
    const lastA = (a.last_name || '').toLowerCase()
    const lastB = (b.last_name || '').toLowerCase()
    if (lastA !== lastB) return lastA.localeCompare(lastB)
    return (a.first_name || '').toLowerCase().localeCompare((b.first_name || '').toLowerCase())
  })

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Billing &amp; Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record payments, issue invoices, apply discounts, and manage installment plans.
        </p>
      </div>

      <BillingClient
        clinicId={clinicId}
        initialTransactions={initialTransactions}
        initialInstallmentPlans={installmentPlansRes.data ?? []}
        appointments={appointmentsRes.data ?? []}
        services={servicesRes.data ?? []}
        products={productsRes.data ?? []}
        patients={activePatients}
      />
    </div>
  )
}
