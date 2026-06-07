import { supabaseAdmin } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/serverSSR'
import { enforceRole } from '@/lib/auth/protection'
import AppointmentsClient from '@/components/features/appointments/AppointmentsClient'

export const metadata = { title: 'Appointments — AppoinDent' }
export const dynamic = 'force-dynamic'
export default async function AppointmentsPage() {
  const authUser = await enforceRole('staff')
  const supabase = await createClient()

  // Resolve clinic_id
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


  // Fetch initial appointments list
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      end_at,
      status,
      notes,
      is_walk_in,
      downpayment,
      payment_method,
      payment_status,
      patients ( id, first_name, last_name, phone ),
      services ( id, name, price, slot_duration_min ),
      dentists ( id, first_name, last_name )
    `)
    .eq('clinic_id', clinicId)
    .order('scheduled_at', { ascending: false })

  const mappedAppointments = (appointments ?? []).map((appt: any) => {
    const rawPatient = appt.patients
    const rawService = appt.services
    const rawDentist = appt.dentists
    return {
      ...appt,
      patients: Array.isArray(rawPatient) ? rawPatient[0] : rawPatient,
      services: Array.isArray(rawService) ? rawService[0] : rawService,
      dentists: Array.isArray(rawDentist) ? rawDentist[0] : rawDentist,
    }
  })

  // Fetch active patients, services, and dentists for booking
  const [patientsRes, servicesRes, dentistsRes] = await Promise.all([
    supabaseAdmin
      .from('clinic_patients')
      .select(`
        is_active,
        patients!inner (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('clinic_id', clinicId)
      .eq('is_active', true),
    supabase
      .from('services')
      .select('id, name, price, slot_duration_min')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('dentists')
      .select('id, first_name, last_name, specialty')
      .eq('clinic_id', clinicId)
      .order('first_name', { ascending: true }),
  ])

  // Map and flatten nested items
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointment Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Book, reschedule, confirm, or cancel patient appointments and register walk-ins.
          </p>
        </div>
      </div>

      <AppointmentsClient
        clinicId={clinicId}
        userId={authUser.id}
        initialAppointments={mappedAppointments}
        patients={activePatients}
        services={servicesRes.data ?? []}
        dentists={dentistsRes.data ?? []}
      />
    </div>
  )
}
