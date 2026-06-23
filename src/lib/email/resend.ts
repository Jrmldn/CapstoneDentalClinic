import 'server-only'
import { Resend } from 'resend'

let resendInstance: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resendInstance) resendInstance = new Resend(process.env.RESEND_API_KEY)
  return resendInstance
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const from = process.env.RESEND_FROM_EMAIL ?? 'AppointDent <onboarding@resend.dev>'
  const client = getResend()

  if (!client) {
    // Stub mode — no API key set
    console.log('[email stub] to:', opts.to, '| subject:', opts.subject)
    return { success: true }
  }

  const { error } = await client.emails.send({ from, to: opts.to, subject: opts.subject, html: opts.html })
  if (error) return { success: false, error: error.message }
  return { success: true }
}
