import { createClient } from '@/lib/supabase/serverSSR'
import { enforceRole } from '@/lib/auth/protection'
import { fetchClinicTransactions } from '@/actions/billingActions'
import BillingClient from '@/components/features/billing/BillingClient'

export const metadata = { title: 'Billing & Invoices — AppoinDent' }

export default async function BillingPage() {
  const authUser = await enforceRole('staff')
  const supabase = await createClient()

  // Resolve clinicId
  const { data: staffRecord } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', authUser.id)
    .maybeSingle()

  const clinicId = staffRecord?.clinic_id as number | undefined
  if (!clinicId) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact a superadmin.
      </div>
    )
  }

  // Fetch initial clinic transactions
  const txRes = await fetchClinicTransactions(clinicId)
  const initialTransactions = txRes.transactions || []

  // Fetch appointments, services, products, and patients for billing creation
  const [appointmentsRes, servicesRes, productsRes, patientsRes] = await Promise.all([
    supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        payment_status,
        patients ( id, first_name, last_name ),
        services ( id, name, price )
      `)
      .eq('clinic_id', clinicId)
      .not('status', 'in', '(cancelled,no_show)')
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('services')
      .select('id, name, price')
      .eq('clinic_id', clinicId)
      .eq('is_active', true),
    supabase
      .from('products')
      .select('id, name, price, quantity')
      .eq('clinic_id', clinicId)
      .eq('is_active', true),
    supabase
      .from('clinic_patients')
      .select(`
        is_active,
        patients!inner (
          id,
          first_name,
          last_name
        )
      `)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
  ])

  // Map and flatten active patients
  const activePatients = (patientsRes.data || [])
    .map((item: any) => item.patients)
    .filter((p): p is any => p !== null)

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
          Record payments, issue invoices, apply discounts (senior/PWD/HMO), and track invoice histories.
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
