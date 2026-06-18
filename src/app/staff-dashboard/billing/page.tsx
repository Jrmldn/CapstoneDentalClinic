import { supabaseAdmin } from '@/lib/supabase/server'
import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import { fetchClinicTransactions } from '@/actions/billingActions'
import BillingClient from '@/components/features/billing/BillingClient'

export const metadata = { title: 'Billing & Invoices — AppoinDent' }

export default async function BillingPage() {
  const authUser = await enforceRole('staff')

  // Resolve clinicId
  const clinicId = await getStaffClinicId(authUser.id)
  if (!clinicId) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact a superadmin.
      </div>
    )
  }

  // Fetch initial clinic transactions, appointments, services, products, and patients for billing creation in parallel (Class A Optimization)
  const [txRes, appointmentsRes, servicesRes, productsRes, patientsRes] = await Promise.all([
    fetchClinicTransactions(clinicId),
    supabaseAdmin
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        payment_status,
        downpayment,
        patients ( id, first_name, last_name ),
        services ( id, name, price )
      `)
      .eq('clinic_id', clinicId)
      .not('status', 'in', '(cancelled,no_show)')
      .order('scheduled_at', { ascending: false }),
    supabaseAdmin
      .from('services')
      .select('id, name, price')
      .eq('clinic_id', clinicId)
      .eq('is_active', true),
    supabaseAdmin
      .from('products')
      .select('id, name, price')
      .eq('clinic_id', clinicId)
      .eq('is_active', true),
    supabaseAdmin
      .from('patients')
      .select('id, first_name, last_name')
      .eq('is_guest', false)
  ])

  const initialTransactions = txRes.transactions || []

  // Map and flatten active patients
  const activePatients = patientsRes.data || []

  // Sort by last name and then first name
  activePatients.sort((a: any, b: any) => {
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
          Record payments, issue invoices, apply discounts (senior/PWD), and track invoice histories.
        </p>
      </div>

      <BillingClient
        clinicId={clinicId}
        initialTransactions={initialTransactions}
        appointments={appointmentsRes.data ?? []}
        services={servicesRes.data ?? []}
        products={productsRes.data ?? []}
        patients={activePatients}
      />
    </div>
  )
}
