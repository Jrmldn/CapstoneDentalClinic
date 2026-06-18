import { supabaseAdmin } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/serverSSR'
import { enforceRole } from '@/lib/auth/protection'
import { getStaffClinicId } from '@/lib/auth/getClinicId'
import AppointmentsClient from '@/components/features/appointments/AppointmentsClient'

import { Appointment, Patient } from '@/components/features/appointments/AppointmentTypes'

export const metadata = { title: 'Appointments — AppoinDent' }
export const dynamic = 'force-dynamic'
export default async function AppointmentsPage() {
  const authUser = await enforceRole('staff')
  const supabase = await createClient()

  // Resolve clinic_id
  const clinicId = await getStaffClinicId(authUser.id)
  if (!clinicId) {
    return (
      <div className="p-8 text-center text-gray-400">
        No clinic assigned to your account. Contact a superadmin.
      </div>
    )
  }


  // Fetch initial appointments list
  const { data: appointments } = await supabaseAdmin
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
      dentists ( id, first_name, last_name, specialty )
    `)
    .eq('clinic_id', clinicId)
    .order('scheduled_at', { ascending: false })

  const mappedAppointments: Appointment[] = (appointments || []).map((appt: any) => {
    const rawPatient = appt.patients
    const rawService = appt.services
    const rawDentist = appt.dentists

    const patientObj = Array.isArray(rawPatient) ? rawPatient[0] : rawPatient
    const serviceObj = Array.isArray(rawService) ? rawService[0] : rawService
    const dentistObj = Array.isArray(rawDentist) ? rawDentist[0] : rawDentist

    return {
      id: appt.id,
      scheduled_at: appt.scheduled_at,
      end_at: appt.end_at,
      status: appt.status,
      notes: appt.notes,
      is_walk_in: appt.is_walk_in,
      downpayment: appt.downpayment,
      payment_method: appt.payment_method,
      payment_status: appt.payment_status,
      patients: patientObj ? {
        id: patientObj.id,
        first_name: patientObj.first_name,
        last_name: patientObj.last_name,
        phone: patientObj.phone ?? ''
      } : null,
      services: serviceObj ? {
        id: serviceObj.id,
        name: serviceObj.name,
        price: serviceObj.price,
        slot_duration_min: serviceObj.slot_duration_min
      } : null,
      dentists: dentistObj ? {
        id: dentistObj.id,
        first_name: dentistObj.first_name,
        last_name: dentistObj.last_name,
        specialty: dentistObj.specialty ?? ''
      } : null,
    }
  })

  // Fetch active patients, services, and dentists for booking
  const [patientsRes, servicesRes, dentistsRes] = await Promise.all([
    supabaseAdmin
      .from('patients')
      .select('id, first_name, last_name, phone')
      .eq('is_guest', false),
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
  const activePatients: Patient[] = (patientsRes.data || []).map((p: any) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    phone: p.phone ?? '',
  }))

  // Sort by last name and then first name
  activePatients.sort((a, b) => {
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
