// lib/authProtection.ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServerSSR'

/**
 * Ensures the logged-in user matches the specified role.
 * If not, triggers an immediate server-side redirect.
 */
export async function enforceRole(requiredRole: 'patient' | 'superadmin') {
  const supabase = await createClient()

  // 1. Get authenticated session
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    // If not logged in, send them to the corresponding login portal
    redirect(requiredRole === 'superadmin' ? '/admin-login' : '/login')
  }

  // 2. Fetch verified role from DB
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .maybeSingle()

  // 3. Evaluate access boundaries
  if (!userData || userData.role !== requiredRole) {
    // Cross-boundary safety redirects
    if (userData?.role === 'superadmin') {
      redirect('/superadmin-dashboard')
    }
    if (userData?.role === 'patient') {
      redirect('/patient-dashboard')
    }
    
    // Total fallback if role is unrecognized
    redirect('/login')
  }

  // Return the authenticated authUser object in case the dashboard needs its ID or email
  return authUser
}