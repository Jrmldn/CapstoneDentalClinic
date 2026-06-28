import { enforceRole } from '@/lib/auth/protection'
import { getDentistRecordByUserId } from '@/services/dashboardService'
import { supabaseAdmin } from '@/lib/supabase/server'
import { normalizeRelation } from '@/lib/utils'
import { fetchServices } from '@/actions/serviceActions'
import { fetchInventoryForDentist } from '@/actions/inventoryActions'
import { AlertCircle } from 'lucide-react'
import DentistAppointmentsClient from './DentistAppointmentsClient'
import type { Appointment } from '@/components/features/dashboard/DentistDashboardView'
import type { Service } from '@/components/features/billing/types'
import type { InventoryItem } from '@/components/features/inventory/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Appointments — AppoinDent' }

export default async function DentistAppointmentsPage() {
  const authUser = await enforceRole('dentist')

  const { data: dentistRecord } = await getDentistRecordByUserId(authUser.id)

  if (!dentistRecord?.id || !dentistRecord?.clinic_id) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white p-8 rounded-2xl border border-gray-150 shadow-sm max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-slate-900">Dentist Profile Missing</h2>
          <p className="text-xs text-gray-500 mt-1.5">
            Could not find your dentist profile or assigned clinic. Contact a superadmin.
          </p>
        </div>
      </div>
    )
  }

  const { data: raw } = await supabaseAdmin
    .from('appointments')
    .select(`
      id, scheduled_at, status, payment_status, is_walk_in, downpayment,
      patients ( id, first_name, last_name, phone ),
      services ( id, name, price )
    `)
    .eq('dentist_id', dentistRecord.id)
    .eq('clinic_id', dentistRecord.clinic_id)
    .order('scheduled_at', { ascending: false })

  type RawAppt = {
    id: number
    scheduled_at: string
    status: string
    payment_status: string
    is_walk_in: boolean
    downpayment: number | null
    patients: { id: number; first_name: string; last_name: string; phone: string } | { id: number; first_name: string; last_name: string; phone: string }[] | null
    services: { id: number; name: string; price: number } | { id: number; name: string; price: number }[] | null
  }

  const appointments: Appointment[] = ((raw ?? []) as RawAppt[]).map(appt => ({
    id: appt.id,
    scheduled_at: appt.scheduled_at,
    status: appt.status,
    payment_status: appt.payment_status,
    is_walk_in: appt.is_walk_in,
    downpayment: appt.downpayment ?? 0,
    patients: normalizeRelation(appt.patients),
    services: normalizeRelation(appt.services),
  }))

  const servicesRes = await fetchServices(dentistRecord.clinic_id)
  const services = (servicesRes.services ?? []) as Service[]

  const inventoryRes = await fetchInventoryForDentist(dentistRecord.clinic_id)
  const inventoryItems = (inventoryRes.items ?? []) as InventoryItem[]

  const { data: clinicData } = await supabaseAdmin
    .from('clinics')
    .select('name')
    .eq('id', dentistRecord.clinic_id)
    .maybeSingle()
  const branchName = clinicData?.name || 'Clinic'
  const dentistName = `${dentistRecord.first_name} ${dentistRecord.last_name}`

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Approve, complete, and send finished appointments to billing.
        </p>
      </div>
      <DentistAppointmentsClient
        appointments={appointments}
        clinicId={dentistRecord.clinic_id}
        dentistUserId={authUser.id}
        dentistId={dentistRecord.id}
        dentistName={dentistName}
        branchName={branchName}
        services={services}
        inventoryItems={inventoryItems}
      />
    </div>
  )
}
