export function patientVerificationEmail(link: string, firstName: string): { subject: string; html: string } {
  return {
    subject: 'Verify your AppointDent account',
    html: `
<!DOCTYPE html>
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
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            Thanks for registering with AppointDent. Click the button below to verify your email
            address and activate your patient account.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="border-radius:8px;background:#2563eb;">
              <a href="${link}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
                Verify Email Address
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px;line-height:1.5;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 24px;word-break:break-all;">
            <a href="${link}" style="color:#2563eb;font-size:12px;">${link}</a>
          </p>
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            This link expires in 24 hours. If you didn't create an account, you can ignore this email.
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} AppointDent. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function passwordResetEmail(link: string): { subject: string; html: string } {
  return {
    subject: 'Reset your AppointDent password',
    html: `
<!DOCTYPE html>
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
          <p style="margin:0 0 12px;color:#111827;font-size:15px;">Hello,</p>
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            We received a request to reset your AppointDent password. Click the button below to create a new password.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="border-radius:8px;background:#2563eb;">
              <a href="${link}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
                Reset Password
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px;line-height:1.5;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 24px;word-break:break-all;">
            <a href="${link}" style="color:#2563eb;font-size:12px;">${link}</a>
          </p>
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            This link expires in 24 hours. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} AppointDent. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function bookingConfirmationEmail({
  firstName,
  appointmentDate,
  appointmentTime,
  branchName,
  dentistName,
}: {
  firstName: string
  appointmentDate: string
  appointmentTime: string
  branchName: string
  dentistName: string
}): { subject: string; html: string } {
  return {
    subject: 'Your AppointDent Appointment is Confirmed',
    html: `
<!DOCTYPE html>
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
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            Your appointment has been confirmed. Here are your details:
          </p>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Appointment Date</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${appointmentDate}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Appointment Time</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${appointmentTime}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Branch</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${branchName}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Dentist</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${dentistName}</td></tr>
          </table>
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">
            Please arrive 10 minutes before your scheduled time.
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} AppointDent. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function rescheduleEmail({
  firstName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  branchName,
  dentistName,
}: {
  firstName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
  branchName: string
  dentistName: string
}): { subject: string; html: string } {
  return {
    subject: 'Your AppointDent Appointment Has Been Rescheduled',
    html: `
<!DOCTYPE html>
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
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            Your appointment has been rescheduled. Here are the details:
          </p>
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Previous Schedule</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 16px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Date</td><td style="padding:10px 16px;font-size:13px;color:#9ca3af;text-decoration:line-through;">${oldDate}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Time</td><td style="padding:10px 16px;font-size:13px;color:#9ca3af;text-decoration:line-through;">${oldTime}</td></tr>
          </table>
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">New Schedule</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Date</td><td style="padding:10px 16px;font-size:13px;color:#111827;font-weight:600;">${newDate}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Time</td><td style="padding:10px 16px;font-size:13px;color:#111827;font-weight:600;">${newTime}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Branch</td><td style="padding:10px 16px;font-size:13px;color:#111827;">${branchName}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Dentist</td><td style="padding:10px 16px;font-size:13px;color:#111827;">${dentistName}</td></tr>
          </table>
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">
            If you have questions, please contact your clinic.
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} AppointDent. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function upcomingReminderEmail({
  firstName,
  appointmentDate,
  appointmentTime,
  branchName,
  dentistName,
}: {
  firstName: string
  appointmentDate: string
  appointmentTime: string
  branchName: string
  dentistName: string
}): { subject: string; html: string } {
  return {
    subject: 'Reminder: Your AppointDent Appointment is Tomorrow',
    html: `
<!DOCTYPE html>
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
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            This is a reminder that you have an appointment tomorrow.
          </p>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Appointment Date</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${appointmentDate}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Appointment Time</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${appointmentTime}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Branch</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${branchName}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Dentist</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${dentistName}</td></tr>
          </table>
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">
            Please arrive 10 minutes before your scheduled time.
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} AppointDent. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function followUpEmail({
  firstName,
  followUpDate,
  followUpTime,
  branchName,
  dentistName,
}: {
  firstName: string
  followUpDate: string
  followUpTime: string
  branchName: string
  dentistName: string
}): { subject: string; html: string } {
  return {
    subject: 'Your AppointDent Follow-Up Appointment',
    html: `
<!DOCTYPE html>
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
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            Your follow-up appointment has been scheduled.
          </p>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Follow-Up Date</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${followUpDate}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Follow-Up Time</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${followUpTime}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Branch</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${branchName}</td></tr>
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;">Dentist</td><td style="padding:12px 16px;font-size:13px;color:#111827;">${dentistName}</td></tr>
          </table>
        </td></tr>
        <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} AppointDent. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function sixMonthRecallEmail({
  firstName,
  clinicName,
  bookingUrl,
}: {
  firstName: string
  clinicName: string
  bookingUrl?: string
}): { subject: string; html: string } {
  const url = bookingUrl ?? '#'
  return {
    subject: 'Time for Your 6-Month Dental Check-Up!',
    html: `
<!DOCTYPE html>
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
          <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
            It's been 6 months since your last visit to ${clinicName}.
          </p>
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            Regular dental check-ups help maintain your oral health and catch issues early.
            We'd love to see you again!
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="border-radius:8px;background:#2563eb;">
              <a href="${url}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
                Book an Appointment
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} AppointDent. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function staffVerificationEmail(link: string, fullName: string): { subject: string; html: string } {
  return {
    subject: 'Set up your AppointDent account',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#2563eb;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">AppointDent</h1>
          <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Personnel Account Setup</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 12px;color:#111827;font-size:15px;">Hi ${fullName},</p>
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            An AppointDent account has been created for you. Click the button below to set
            your permanent password and access your dashboard.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="border-radius:8px;background:#2563eb;">
              <a href="${link}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
                Set My Password
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px;line-height:1.5;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 24px;word-break:break-all;">
            <a href="${link}" style="color:#2563eb;font-size:12px;">${link}</a>
          </p>
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            This link expires in 24 hours. If you did not expect this email, please contact your clinic administrator.
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} AppointDent. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}
