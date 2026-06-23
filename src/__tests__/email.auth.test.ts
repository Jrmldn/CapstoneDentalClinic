import { describe, it, expect, vi, beforeEach } from 'vitest'

// NEXT_PUBLIC_SITE_URL is read when building recovery callback URLs — without a
// valid base, `new URL('/auth/callback')` throws and the action would fail.
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

// Module mocks (hoisted before imports)
vi.mock('@/lib/email/resend', () => ({ sendEmail: vi.fn() }))
vi.mock('@/lib/email/templates', () => ({
  patientVerificationEmail: vi.fn((link: string) => ({ subject: 'verify', html: link })),
  passwordResetEmail: vi.fn((link: string) => ({ subject: 'reset', html: link })),
  staffVerificationEmail: vi.fn((link: string) => ({ subject: 'staff', html: link })),
}))
vi.mock('@/lib/errors/sanitizeError', () => ({ sanitizeServerError: () => 'sanitized error' }))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    auth: { admin: { generateLink: vi.fn(), deleteUser: vi.fn() } },
    from: vi.fn(),
  },
}))

// Imports (after mocks)
import { supabaseAdmin } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { patientVerificationEmail, passwordResetEmail } from '@/lib/email/templates'
import { signUpPatient } from '@/actions/authActions'
import { requestPasswordReset } from '@/actions/passwordResetActions'

const mockGenerateLink = vi.mocked(supabaseAdmin.auth.admin.generateLink)
const mockDeleteUser = vi.mocked(supabaseAdmin.auth.admin.deleteUser)
const mockFrom = vi.mocked(supabaseAdmin.from)
const mockSendEmail = vi.mocked(sendEmail)

// Captures the .eq() args for the most recent update/delete chains.
let updateEq: ReturnType<typeof vi.fn>
let deleteEq: ReturnType<typeof vi.fn>

const baseSignUp = {
  email: 'patient@example.com',
  password: 'password123',
  first_name: 'Juan',
  last_name: 'Cruz',
  phone: '09171234567',
  birthdate: '1990-01-01',
  redirectTo: 'http://localhost:3000/auth/callback',
}

beforeEach(() => {
  vi.clearAllMocks()
  updateEq = vi.fn().mockResolvedValue({ data: null, error: null })
  deleteEq = vi.fn().mockResolvedValue({ data: null, error: null })
  mockFrom.mockReturnValue({
    update: vi.fn(() => ({ eq: updateEq })),
    delete: vi.fn(() => ({ eq: deleteEq })),
  } as never)
  mockDeleteUser.mockResolvedValue({ data: { user: null }, error: null } as never)
  mockSendEmail.mockResolvedValue({ success: true })
})

describe('signUpPatient — patient email verification', () => {
  it('emails a deterministic token_hash callback link and updates birthdate', async () => {
    mockGenerateLink.mockResolvedValue({
      data: { user: { id: 'uid-1' }, properties: { hashed_token: 'HASH123' } },
      error: null,
    } as never)

    const res = await signUpPatient(baseSignUp)

    expect(res.success).toBe(true)

    // #1: link goes to our callback with token_hash + type=signup, not action_link
    const link = vi.mocked(patientVerificationEmail).mock.calls[0][0]
    expect(link).toContain('/auth/callback')
    expect(link).toContain('token_hash=HASH123')
    expect(link).toContain('type=signup')

    // birthdate written directly (handle_new_user trigger doesn't map it)
    expect(mockFrom).toHaveBeenCalledWith('patients')
    expect(updateEq).toHaveBeenCalledWith('user_id', 'uid-1')

    // success path performs no rollback
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('returns a friendly message for an already-registered email', async () => {
    mockGenerateLink.mockResolvedValue({
      data: { user: null, properties: null },
      error: { message: 'A user with this email address has already been registered' },
    } as never)

    const res = await signUpPatient(baseSignUp)

    expect(res.success).toBe(false)
    expect(res.error).toContain('already exists')
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('rolls back patients, users, and the auth user when the email fails to send', async () => {
    mockGenerateLink.mockResolvedValue({
      data: { user: { id: 'uid-9' }, properties: { hashed_token: 'H' } },
      error: null,
    } as never)
    mockSendEmail.mockResolvedValue({ success: false, error: 'smtp down' })

    const res = await signUpPatient(baseSignUp)

    expect(res.success).toBe(false)
    // #4: child-first teardown so the email can be reused on retry
    expect(mockFrom).toHaveBeenCalledWith('patients')
    expect(mockFrom).toHaveBeenCalledWith('users')
    expect(deleteEq).toHaveBeenCalledWith('user_id', 'uid-9')
    expect(deleteEq).toHaveBeenCalledWith('id', 'uid-9')
    expect(mockDeleteUser).toHaveBeenCalledWith('uid-9')
  })
})

describe('requestPasswordReset — forgot password', () => {
  it('does not reveal that an email is unregistered (no enumeration)', async () => {
    mockGenerateLink.mockResolvedValue({
      data: null,
      error: { message: 'User not found' },
    } as never)

    const res = await requestPasswordReset('ghost@example.com')

    // #2: returns success regardless, and sends nothing
    expect(res.success).toBe(true)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('emails a recovery token_hash link for a registered email', async () => {
    mockGenerateLink.mockResolvedValue({
      data: { properties: { hashed_token: 'RECOVER1' } },
      error: null,
    } as never)

    const res = await requestPasswordReset('real@example.com')

    expect(res.success).toBe(true)
    const link = vi.mocked(passwordResetEmail).mock.calls[0][0]
    expect(link).toContain('token_hash=RECOVER1')
    expect(link).toContain('type=recovery')
    expect(link).toContain('next=')
  })

  it('reports failure when the reset email cannot be sent', async () => {
    mockGenerateLink.mockResolvedValue({
      data: { properties: { hashed_token: 'RECOVER1' } },
      error: null,
    } as never)
    mockSendEmail.mockResolvedValue({ success: false, error: 'down' })

    const res = await requestPasswordReset('real@example.com')

    expect(res.success).toBe(false)
  })
})
