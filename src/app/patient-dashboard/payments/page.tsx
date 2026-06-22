import { enforceRole } from '@/lib/auth/protection'
import { createClient } from '@/lib/supabase/serverSSR'
import { supabaseAdmin } from '@/lib/supabase/server'
import PaymentsClient from './PaymentsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Payments — AppoinDent' }

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

export default async function PatientPaymentsPage() {
  const authUser = await enforceRole('patient')
  const supabase = await createClient()

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (!patient) {
    return (
      <div className="text-center p-8 text-gray-400">Patient record not found.</div>
    )
  }

  const { data: rawPlans } = await supabaseAdmin
    .from('installment_plans')
    .select(`
      id, transaction_id, total_amount, num_installments,
      notes, status, created_at,
      transactions ( id, created_at, transaction_items ( description ) ),
      installment_payments (
        id, plan_id, installment_number, due_date, amount, status, paid_at
      )
    `)
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false })

  const plans = (rawPlans ?? []) as InstallmentPlanRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          View your installment schedules and pay upcoming dues online.
        </p>
      </div>

      <PaymentsClient plans={plans} patientId={patient.id} />
    </div>
  )
}
