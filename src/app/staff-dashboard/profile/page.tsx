import { createClient } from '@/lib/supabase/serverSSR'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/server'
import ProfileTabs from './_components/ProfileTabs'

export default async function ClinicProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Resolve clinic
  const { data: staffRecord } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!staffRecord?.clinic_id) redirect('/staff-dashboard')
  const clinicId = staffRecord.clinic_id

  // Fetch all profile data in parallel
  const [clinicRes, hoursRes, hmoRes, specialtiesRes, galleryRes] = await Promise.all([
    supabaseAdmin.from('clinics').select('*').eq('id', clinicId).single(),
    supabaseAdmin
      .from('clinic_operating_hours')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('day_of_week', { ascending: true }),
    supabaseAdmin.from('clinic_hmo').select('*').eq('clinic_id', clinicId),
    supabaseAdmin.from('clinic_specialties').select('*').eq('clinic_id', clinicId),
    supabaseAdmin
      .from('clinic_gallery')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clinic Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your clinic information, operating hours, accepted HMOs, and gallery.
        </p>
      </div>

      <ProfileTabs
        clinicId={clinicId}
        clinic={clinicRes.data}
        operatingHours={hoursRes.data ?? []}
        hmos={hmoRes.data ?? []}
        specialties={specialtiesRes.data ?? []}
        gallery={galleryRes.data ?? []}
      />
    </div>
  )
}
