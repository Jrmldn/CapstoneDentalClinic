import { createClient } from '@/lib/supabase/serverSSR'
import { enforceRole } from '@/lib/auth/protection'
import {
  generateSalesReport,
  generateAppointmentSummary,
  generateServiceFrequency
} from '@/actions/managementActions'
import ReportsClient from '@/components/features/reports/ReportsClient'

export const metadata = { title: 'Reports & Analytics — AppoinDent' }

export default async function ReportsPage() {
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

  // Load last 30 days reports by default
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [salesRes, apptRes, freqRes] = await Promise.all([
    generateSalesReport(clinicId, thirtyDaysAgo, today),
    generateAppointmentSummary(clinicId, thirtyDaysAgo, today),
    generateServiceFrequency(clinicId, thirtyDaysAgo, today)
  ])

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports &amp; Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track business performance, service usage frequency, and clinic appointment rates.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm shadow-sm"
        >
          Print / Save PDF
        </button>
      </div>

      <ReportsClient
        clinicId={clinicId}
        defaultSales={salesRes.success ? salesRes : null}
        defaultAppts={apptRes.success ? apptRes : null}
        defaultFreq={freqRes.success ? freqRes : null}
        startDate={thirtyDaysAgo}
        endDate={today}
      />
    </div>
  )
}
