import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@appointdent.com'
const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') ?? ''

const supabase = createClient(supabaseUrl, serviceRoleKey)

function buildRecallHtml(firstName: string, clinicName: string, bookingUrl: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#2563eb;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">AppointDent</h1>
          <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Your Dental Clinic Portal</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 12px;color:#111827;font-size:15px;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">It's been 6 months since your last visit to ${clinicName}.</p>
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">Regular dental check-ups help maintain your oral health and catch issues early. We'd love to see you again!</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="border-radius:8px;background:#2563eb;">
              <a href="${bookingUrl}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Book an Appointment</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© ${year} AppointDent. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

Deno.serve(async () => {
  try {
    const now = new Date()
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // 5.5–6.5 month window
    const windowStart = new Date(sixMonthsAgo)
    windowStart.setDate(windowStart.getDate() - 15)
    const windowEnd = new Date(sixMonthsAgo)
    windowEnd.setDate(windowEnd.getDate() + 15)

    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Find patients whose most recent completed appointment falls in the 6-month window
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        patient_id,
        scheduled_at,
        patients ( id, first_name, email ),
        clinics ( name )
      `)
      .eq('status', 'completed')
      .gte('scheduled_at', windowStart.toISOString())
      .lte('scheduled_at', windowEnd.toISOString())
      .order('scheduled_at', { ascending: false })

    if (error) throw error

    // Deduplicate to one per patient (most recent completed appointment in window)
    const seen = new Set<number>()
    const candidates = []
    for (const appt of appointments ?? []) {
      const patientId = Array.isArray(appt.patients) ? appt.patients[0]?.id : appt.patients?.id
      if (!patientId || seen.has(patientId)) continue
      seen.add(patientId)
      candidates.push(appt)
    }

    const results = []

    for (const appt of candidates) {
      const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients
      const clinic = Array.isArray(appt.clinics) ? appt.clinics[0] : appt.clinics

      if (!patient?.email || !patient.first_name) continue

      // Skip if already sent a six_month_recall in last 30 days
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patient.id)
        .eq('trigger_type', 'six_month_recall')
        .gte('created_at', thirtyDaysAgo.toISOString())

      if ((count ?? 0) > 0) continue

      const clinicName = clinic?.name ?? 'AppointDent'
      const bookingUrl = siteUrl ? `${siteUrl}/patient-dashboard/booking` : '#'
      const html = buildRecallHtml(patient.first_name, clinicName, bookingUrl)

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: patient.email,
          subject: 'Time for Your 6-Month Dental Check-Up!',
          html,
        }),
      })

      const success = emailRes.ok
      const errorBody = success ? null : await emailRes.text()

      await supabase.from('notifications').insert({
        patient_id: patient.id,
        trigger_type: 'six_month_recall',
        channel: 'email',
        status: success ? 'sent' : 'failed',
        error_message: errorBody,
        sent_at: success ? new Date().toISOString() : null,
      })

      results.push({ patientId: patient.id, success })
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-six-month-recalls error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
