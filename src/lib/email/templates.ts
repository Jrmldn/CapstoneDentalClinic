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
