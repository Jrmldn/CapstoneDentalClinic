import { enforceRole } from '@/lib/auth/protection'
import { createClient } from '@/lib/supabase/serverSSR'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getInstallmentsByPatient } from '@/services/installmentService'
import PatientTransactionsClient from './PatientTransactionsClient'
import type { Transaction, InstallmentPlan } from '@/components/features/billing/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Transactions — AppoinDent' }

export default async function PatientTransactionsPage() {
  const authUser = await enforceRole('patient')
  const supabase = await createClient()

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (!patient) {
    return <div className="text-center p-8 text-gray-400">Patient record not found.</div>
  }

  const { data: rawTransactions } = await supabaseAdmin
    .from('transactions')
    .select(`
      id, appointment_id, patient_id, clinic_id, billing_status,
      subtotal, discount_type, discount_amount, hmo_coverage, philhealth_coverage,
      total_amount, payment_method, payment_status, created_at,
      patients ( first_name, last_name ),
      transaction_items ( id, description, quantity, unit_price, total_price )
    `)
    .eq('patient_id', patient.id)
    .eq('billing_status', 'issued')
    .order('created_at', { ascending: false })

  const transactions = (rawTransactions ?? []) as Transaction[]

  const { data: rawPlans } = await getInstallmentsByPatient(patient.id)
  const installmentPlans = (rawPlans ?? []) as InstallmentPlan[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">
          View your completed invoices and receipts.
        </p>
      </div>
      <PatientTransactionsClient transactions={transactions} installmentPlans={installmentPlans} />
    </div>
  )
}
