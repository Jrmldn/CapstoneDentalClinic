'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { passwordResetEmail } from '@/lib/email/templates'
import { sanitizeServerError } from '@/lib/errors/sanitizeError'

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    })

    // Don't reveal whether the email is registered — return success regardless so
    // the response can't be used to enumerate accounts. Log server-side instead.
    if (linkError || !linkData?.properties?.hashed_token) {
      if (linkError) console.error('requestPasswordReset generateLink error:', linkError.message)
      return { success: true }
    }

    // Use token_hash URL directly — action_link goes through Supabase's /verify
    // which uses PKCE for recovery, requiring a code_verifier that doesn't exist
    // for server-side generated links. verifyOtp with token_hash bypasses this.
    const callbackUrl = new URL(`${siteUrl}/auth/callback`)
    callbackUrl.searchParams.set('token_hash', linkData.properties.hashed_token)
    callbackUrl.searchParams.set('type', 'recovery')
    callbackUrl.searchParams.set('next', '/update-password')

    const template = passwordResetEmail(callbackUrl.toString())
    const sent = await sendEmail({ to: email, ...template })

    if (!sent.success) {
      return { success: false, error: 'Failed to send password reset email. Please try again.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in requestPasswordReset:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}
