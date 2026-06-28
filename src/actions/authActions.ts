'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { patientVerificationEmail } from '@/lib/email/templates'
import { sanitizeServerError } from '@/lib/errors/sanitizeError'
import { logNotification } from '@/lib/notifications/logNotification'
import { headers } from 'next/headers'

export interface SignUpPatientInput {
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string
  birthdate: string
  redirectTo: string
}

export async function signUpPatient(input: SignUpPatientInput): Promise<{ success: boolean; error?: string }> {
  const { email, password, first_name, last_name, phone, birthdate, redirectTo } = input

  let userId: string | undefined

  try {
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: { first_name, last_name, phone, birthdate, role: 'patient' },
        redirectTo,
      },
    })

    if (linkError) {
      if (linkError.message.toLowerCase().includes('already')) {
        return { success: false, error: 'An account with this email already exists. Please sign in instead.' }
      }
      return { success: false, error: linkError.message }
    }
    if (!linkData.user || !linkData.properties?.hashed_token) {
      return { success: false, error: 'Failed to create account.' }
    }

    userId = linkData.user.id

    // The handle_new_user trigger doesn't map birthdate from metadata,
    // so update the patient row directly after the trigger has fired.
    if (birthdate) {
      await supabaseAdmin
        .from('patients')
        .update({ birthdate })
        .eq('user_id', userId)
    }

    // Build a token_hash callback URL — the same deterministic mechanism the
    // recovery flow uses. The callback verifies it server-side via verifyOtp,
    // establishing the session without depending on Supabase's hosted redirect.
    const callbackUrl = new URL(redirectTo)
    callbackUrl.searchParams.set('token_hash', linkData.properties.hashed_token)
    callbackUrl.searchParams.set('type', 'signup')

    const template = patientVerificationEmail(callbackUrl.toString(), first_name)
    const sent = await sendEmail({ to: email, ...template })

    const { data: patientRow } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (patientRow?.id) {
      const headersList = await headers()
      const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || '127.0.0.1'
      // Ensure the consent row exists, whether or not the trigger created it
      const { data: existingConsent } = await supabaseAdmin
        .from('informed_consent')
        .select('id')
        .eq('patient_id', patientRow.id)
        .maybeSingle()

      if (existingConsent) {
        const { error: consentError } = await supabaseAdmin
          .from('informed_consent')
          .update({
            accepted_at: new Date().toISOString(),
            ip_address: ipAddress,
          })
          .eq('id', existingConsent.id)
          
        if (consentError) {
          console.error('Failed to update informed consent record:', consentError)
          await rollbackSignup(userId!)
          return { success: false, error: 'Failed to record informed consent.' }
        }
      } else {
        const { error: consentError } = await supabaseAdmin
          .from('informed_consent')
          .insert({
            patient_id: patientRow.id,
            accepted_at: new Date().toISOString(),
            ip_address: ipAddress,
          })
          
        if (consentError) {
          console.error('Failed to insert informed consent record:', consentError)
          await rollbackSignup(userId!)
          return { success: false, error: 'Failed to record informed consent.' }
        }
      }
    }

    await logNotification({
      patientId: patientRow?.id ?? undefined,
      triggerType: 'email_verification',
      channel: 'email',
      status: sent.success ? 'sent' : 'failed',
      errorMessage: sent.error,
    })

    if (!sent.success) {
      await rollbackSignup(userId!)
      return { success: false, error: 'Failed to send verification email. Please try again.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in signUpPatient:', error)
    if (userId) {
      await rollbackSignup(userId).catch(() => { })
    }
    return { success: false, error: sanitizeServerError(error) }
  }
}
async function rollbackSignup(userId: string) {
  await supabaseAdmin.from('patients').delete().eq('user_id', userId)
  await supabaseAdmin.from('users').delete().eq('id', userId)
  await supabaseAdmin.auth.admin.deleteUser(userId)
}
