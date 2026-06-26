import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import ProfileTabs from './_components/ProfileTabs'
import { enforceRole } from '@/lib/auth/protection'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClinicProfilePage({ params }: Props) {
  await enforceRole('superadmin')
  const { id } = await params
  const clinicId = parseInt(id, 10)

  if (isNaN(clinicId)) {
    redirect('/superadmin-dashboard/clinic')
  }

  const [clinicRes, hoursRes, galleryRes, holidaysRes] = await Promise.all([
    supabaseAdmin.from('clinics').select('*').eq('id', clinicId).single(),
    supabaseAdmin
      .from('clinic_operating_hours')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('day_of_week', { ascending: true }),
    supabaseAdmin
      .from('clinic_gallery')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('sort_order', { ascending: true }),
    supabaseAdmin
      .from('clinic_holidays')
      .select('id, date, description, is_special_day')
      .eq('clinic_id', clinicId)
      .order('date', { ascending: true }),
  ])

  if (!clinicRes.data) {
    redirect('/superadmin-dashboard/clinic')
  }

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/superadmin-dashboard/clinic"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Clinics &amp; Branches
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clinic Profile: {clinicRes.data.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage general information, operating hours, specialties, gallery, and holidays.
        </p>
      </div>

      <ProfileTabs
        clinicId={clinicId}
        clinic={clinicRes.data}
        operatingHours={hoursRes.data ?? []}
        gallery={galleryRes.data ?? []}
        holidays={holidaysRes.data ?? []}
      />
    </div>
  )
}
