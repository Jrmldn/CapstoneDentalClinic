'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/serverSSR'

export async function handleLogout(redirectTo: string) {
  const client = await createClient()

  try {
    await client.auth.signOut()
  } catch (error) {
    console.error('Sign out error:', error)
  }

  redirect(redirectTo)
}
