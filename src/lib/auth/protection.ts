import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/serverSSR'
import { cache } from 'react'

export const enforceRole = cache(async (requiredRole: 'patient' | 'superadmin' | 'staff' | 'dentist') => {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect(requiredRole === 'superadmin' ? '/superadmin-login' : '/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, is_disabled')
    .eq('id', authUser.id)
    .maybeSingle()

  if (userData?.is_disabled) {
    redirect('/login?error=ACCOUNT_DISABLED')
  }

  if (!userData || userData.role !== requiredRole) {
    if (userData?.role === 'superadmin') redirect('/superadmin-dashboard')
    if (userData?.role === 'staff') redirect('/staff-dashboard')
    if (userData?.role === 'dentist') redirect('/dentist-dashboard')
    if (userData?.role === 'patient') redirect('/')

    redirect('/login')
  }

  return authUser
})
