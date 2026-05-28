'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServerSSR'

export async function handleLogout(redirectTo: string) {
  const client = await createClient()
  
  try {
    await client.auth.signOut()
  } catch (error) {
    console.error('Sign out error:', error)
  }

  // Next.js redirect must run outside of the try/catch block
  redirect(redirectTo)
}
