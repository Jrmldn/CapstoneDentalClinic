import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@appointdent.com'

const supabase = createClient(supabaseUrl, serviceRoleKey)

function buildReminderHtml(firstName: string, appointmentDate: string, appointmentTime: string, branchName: string, dentistName: string): string {
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
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">This is a reminder that you have an appointment tomorrow.</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Appointment Date</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${appointmentDate}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Appointment Time</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${appointmentTime}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Branch</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${branchName}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Dentist</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${dentistName}</td></tr>
          </table>
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">Please arrive 10 minutes before your scheduled time.</p>
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
    const tomorrowStart = new Date(now)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    tomorrowStart.setHours(0, 0, 0, 0)
    const tomorrowEnd = new Date(tomorrowStart)
    tomorrowEnd.setHours(23, 59, 59, 999)

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        patient_id,
        patients ( id, first_name, email ),
        dentists ( first_name, last_name ),
        clinics ( name )
      `)
      .eq('status', 'confirmed')
      .gte('scheduled_at', tomorrowStart.toISOString())
      .lte('scheduled_at', tomorrowEnd.toISOString())

    if (error) throw error

    const results = []

    for (const appt of appointments ?? []) {
      const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients
      const dentist = Array.isArray(appt.dentists) ? appt.dentists[0] : appt.dentists
      const clinic = Array.isArray(appt.clinics) ? appt.clinics[0] : appt.clinics

      if (!patient?.email || !patient.first_name) continue

      // Skip if already sent a day_before notification for this appointment
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('appointment_id', appt.id)
        .eq('trigger_type', 'day_before')

      if ((count ?? 0) > 0) continue

      const apptDate = new Date(appt.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      const apptTime = new Date(appt.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      const dentistName = dentist ? `Dr. ${dentist.first_name} ${dentist.last_name}` : 'Your Dentist'
      const branchName = clinic?.name ?? 'Your Clinic'

      const html = buildReminderHtml(patient.first_name, apptDate, apptTime, branchName, dentistName)

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: patient.email,
          subject: 'Reminder: Your AppointDent Appointment is Tomorrow',
          html,
        }),
      })

      const success = emailRes.ok
      const errorBody = success ? null : await emailRes.text()

      await supabase.from('notifications').insert({
        appointment_id: appt.id,
        patient_id: patient.id,
        trigger_type: 'day_before',
        channel: 'email',
        status: success ? 'sent' : 'failed',
        error_message: errorBody,
        sent_at: success ? new Date().toISOString() : null,
      })

      results.push({ appointmentId: appt.id, success })
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-appointment-reminders error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
