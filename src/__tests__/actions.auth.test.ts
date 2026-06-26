import { describe, it, expect, vi, beforeEach } from 'vitest'

// addStaff/addDentist build recovery callback URLs from this base.
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

// Module mocks (hoisted before imports)
vi.mock('@/lib/auth/ensureRole')
vi.mock('@/lib/auth/validatePatientAccess')
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/email/resend', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock('@/lib/email/templates', () => ({
  staffVerificationEmail: vi.fn(() => ({ subject: 's', html: 'h' })),
  patientVerificationEmail: vi.fn(() => ({ subject: 's', html: 'h' })),
  passwordResetEmail: vi.fn(() => ({ subject: 's', html: 'h' })),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

vi.mock('@/lib/encryption/medicalEncryption', () => ({
  encryptMedicalData: vi.fn((v: string) => Promise.resolve(`enc:${v}`)),
  decryptMedicalData: vi.fn((v: string) => Promise.resolve(v.replace(/^enc:/, ''))),
}))

vi.mock('@/services/appointmentService', () => ({
  getAppointmentStatus: vi.fn(),
  insertAppointmentLog: vi.fn().mockResolvedValue({ error: null }),
  updateAppointmentDetails: vi.fn().mockResolvedValue({ error: null }),
  // unused in our tests but imported at module level
  getAppointmentsByDateRange: vi.fn(),
  getClinicHoliday: vi.fn(),
  getClinicOperatingHours: vi.fn(),
  getDentistAvailability: vi.fn(),
  getDentistBlockedSlots: vi.fn(),
  getServiceById: vi.fn(),
  getActiveAppointmentsForSlots: vi.fn(),
  getClinicCapacity: vi.fn(),
  insertAppointment: vi.fn(),
  updateClinicMaxLimit: vi.fn(),
}))

vi.mock('@/services/personnelService', () => ({
  createAuthUser: vi.fn(),
  deleteAuthUser: vi.fn(),
  insertStaff: vi.fn(),
  insertDentist: vi.fn(),
  deleteUserRecord: vi.fn(),
  getAllStaff: vi.fn(),
  getAllDentists: vi.fn(),
  getStaffList: vi.fn(),
  getDentistsList: vi.fn(),
  updatePersonnelRecord: vi.fn(),
  getMatchingUserIds: vi.fn(),
  generateRecoveryLink: vi.fn(),
}))

vi.mock('@/utils/personnel-helpers', () => ({
  getPaginationRange: vi.fn(() => ({ from: 0, to: 9 })),
  formatStaff: vi.fn((d: unknown[]) => d),
  formatDentists: vi.fn((d: unknown[]) => d),
}))

vi.mock('@/utils/appointment-helpers', () => ({
  generateTimeSlots: vi.fn(() => []),
}))

vi.mock('@/services/billingService', () => ({
  getTransactionsByPatient:    vi.fn().mockResolvedValue({ data: [], error: null }),
  getTreatmentHistoryByPatient: vi.fn().mockResolvedValue({ data: [], error: null }),
  insertTransactionHeader:     vi.fn(),
  insertTransactionItems:      vi.fn(),
  syncAppointmentPayment:      vi.fn(),
  syncAppointmentPaymentDetails: vi.fn(),
  updateTransactionPayment:    vi.fn(),
  getTransactionsByClinic:     vi.fn(),
}))

vi.mock('@/utils/billing-helpers', () => ({
  calculateTransactionAmounts: vi.fn(() => ({ subtotal: 0, discount_amount: 0, total_amount: 0 })),
}))

// Imports (after mocks)
import { ensureRole } from '@/lib/auth/ensureRole'
import { validatePatientAccess } from '@/lib/auth/validatePatientAccess'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAppointmentStatus } from '@/services/appointmentService'
import {
  createAuthUser,
  insertStaff,
  getAllStaff,
  getAllDentists,
  generateRecoveryLink,
} from '@/services/personnelService'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import {
  addStaff,
  addDentist,
  fetchPersonnel,
  fetchStaff,
  fetchDentists,
  updatePersonnel,
} from '@/actions/personnelActions'
import { fetchPatientRecord } from '@/actions/patientMedicalActions'
import { fetchPatientBillingHistory } from '@/actions/billingActions'

const mockEnsureRole = vi.mocked(ensureRole)
const mockValidatePatientAccess = vi.mocked(validatePatientAccess)
const mockGetAppointmentStatus = vi.mocked(getAppointmentStatus)
const mockSupabaseFrom = vi.mocked(supabaseAdmin.from)

// Fluent query chain factory
function makeChain(resolved: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  chain.select = vi.fn(self)
  chain.eq = vi.fn(self)
  chain.order = vi.fn(self)
  chain.limit = vi.fn(self)
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved)
  chain.single = vi.fn().mockResolvedValue(resolved)
  chain.insert = vi.fn(self)
  chain.update = vi.fn(self)
  chain.delete = vi.fn(self)
  return chain
}

// 2.3 updateAppointmentStatus — patient access control
describe('2.3 updateAppointmentStatus — patient access control', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns Insufficient permissions when patient updates another patient\'s appointment', async () => {
    mockEnsureRole.mockResolvedValue({ success: true, userId: 'patient-uid-A', role: 'patient' })

    // Appointment belongs to patient_id 99
    mockGetAppointmentStatus.mockResolvedValue({
      data: {
        status: 'pending',
        patient_id: 99,
        scheduled_at: '2026-01-01T09:00:00+00:00',
        end_at: '2026-01-01T09:30:00+00:00',
        reschedule_count: 0,
        booked_at: null,
      },
      error: null,
    } as never)

    // patients table lookup → this patient has id 1 (≠ 99)
    mockSupabaseFrom.mockReturnValue(makeChain({ data: { id: 1 }, error: null }) as ReturnType<typeof supabaseAdmin.from>)

    const result = await updateAppointmentStatus(42, 'cancelled', '', '')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Insufficient permissions')
  })

  it('allows patient to cancel their own appointment', async () => {
    mockEnsureRole.mockResolvedValue({ success: true, userId: 'patient-uid-A', role: 'patient' })

    // Appointment belongs to patient_id 7
    mockGetAppointmentStatus.mockResolvedValue({
      data: {
        status: 'pending',
        patient_id: 7,
        scheduled_at: '2026-01-01T09:00:00+00:00',
        end_at: '2026-01-01T09:30:00+00:00',
        reschedule_count: 0,
        booked_at: null,
      },
      error: null,
    } as never)

    // patients table lookup → this patient has id 7 (matches)
    mockSupabaseFrom.mockReturnValue(makeChain({ data: { id: 7 }, error: null }) as ReturnType<typeof supabaseAdmin.from>)

    const result = await updateAppointmentStatus(42, 'cancelled', '', '')
    expect(result.success).toBe(true)
  })

  it('blocks an unauthenticated caller entirely', async () => {
    mockEnsureRole.mockResolvedValue({ success: false, error: 'Not authenticated' })

    const result = await updateAppointmentStatus(42, 'cancelled', '', '')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
    // Should not touch the database at all
    expect(mockGetAppointmentStatus).not.toHaveBeenCalled()
  })
})

// 2.4 personnelActions — superadmin-only enforcement
describe('2.4 personnelActions — superadmin-only enforcement', () => {
  beforeEach(() => vi.clearAllMocks())

  const nonSuperadminRoles = ['patient', 'dentist', 'staff'] as const

  describe('addStaff()', () => {
    for (const role of nonSuperadminRoles) {
      it(`blocks ${role}`, async () => {
        mockEnsureRole.mockResolvedValue({ success: false, error: 'Insufficient permissions' })
        const result = await addStaff({ email: 'x@x.com', password: 'p', firstName: 'A', lastName: 'B', clinicId: 1 } as never)
        expect(result.success).toBe(false)
        expect(result.error).toBe('Insufficient permissions')
        expect(vi.mocked(createAuthUser)).not.toHaveBeenCalled()
      })
    }

    it('allows superadmin', async () => {
      mockEnsureRole.mockResolvedValue({ success: true, userId: 'admin-uid', role: 'superadmin' })
      vi.mocked(createAuthUser).mockResolvedValue({ data: { user: { id: 'new-uid' } }, error: null } as never)
      vi.mocked(insertStaff).mockResolvedValue({ error: null } as never)
      vi.mocked(generateRecoveryLink).mockResolvedValue({ data: { properties: { hashed_token: 'H' } }, error: null } as never)

      const result = await addStaff({ email: 'x@x.com', password: 'p', firstName: 'A', lastName: 'B', clinicId: 1 } as never)
      expect(result.success).toBe(true)
    })
  })

  describe('addDentist()', () => {
    for (const role of nonSuperadminRoles) {
      it(`blocks ${role}`, async () => {
        mockEnsureRole.mockResolvedValue({ success: false, error: 'Insufficient permissions' })
        const result = await addDentist({ email: 'x@x.com', password: 'p', firstName: 'A', lastName: 'B', clinicId: 1 } as never)
        expect(result.success).toBe(false)
      })
    }
  })

  describe('fetchPersonnel()', () => {
    for (const role of nonSuperadminRoles) {
      it(`blocks ${role}`, async () => {
        mockEnsureRole.mockResolvedValue({ success: false, error: 'Insufficient permissions' })
        const result = await fetchPersonnel()
        expect(result.success).toBe(false)
        expect(vi.mocked(getAllStaff)).not.toHaveBeenCalled()
      })
    }

    it('allows superadmin', async () => {
      mockEnsureRole.mockResolvedValue({ success: true, userId: 'admin-uid', role: 'superadmin' })
      vi.mocked(getAllStaff).mockResolvedValue({ data: [], error: null } as never)
      vi.mocked(getAllDentists).mockResolvedValue({ data: [], error: null } as never)
      const result = await fetchPersonnel()
      expect(result.success).toBe(true)
    })
  })

  describe('fetchStaff()', () => {
    for (const role of nonSuperadminRoles) {
      it(`blocks ${role}`, async () => {
        mockEnsureRole.mockResolvedValue({ success: false, error: 'Insufficient permissions' })
        const result = await fetchStaff()
        expect(result.success).toBe(false)
      })
    }
  })

  describe('fetchDentists()', () => {
    for (const role of nonSuperadminRoles) {
      it(`blocks ${role}`, async () => {
        mockEnsureRole.mockResolvedValue({ success: false, error: 'Insufficient permissions' })
        const result = await fetchDentists()
        expect(result.success).toBe(false)
      })
    }
  })

  describe('updatePersonnel()', () => {
    for (const role of nonSuperadminRoles) {
      it(`blocks ${role}`, async () => {
        mockEnsureRole.mockResolvedValue({ success: false, error: 'Insufficient permissions' })
        const result = await updatePersonnel('uid', 'staff', { firstName: 'A', lastName: 'B', clinicId: 1 })
        expect(result.success).toBe(false)
      })
    }
  })
})

// 4.4 Patient data access control
describe('4.4 fetchPatientRecord — cross-patient access control', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks patient accessing another patient\'s record', async () => {
    mockValidatePatientAccess.mockResolvedValue({ allowed: false, reason: 'Access denied' })
    const result = await fetchPatientRecord(99)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Access denied')
    expect(result.record).toBeNull()
  })

  it('blocks unauthenticated caller', async () => {
    mockValidatePatientAccess.mockResolvedValue({ allowed: false, reason: 'Not authenticated' })
    const result = await fetchPatientRecord(1)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('allows access when validatePatientAccess passes', async () => {
    mockValidatePatientAccess.mockResolvedValue({ allowed: true, callerId: 'uid', role: 'patient' })

    // stub all DB fetches that fetchPatientRecord makes
    mockSupabaseFrom.mockReturnValue(makeChain({ data: { id: 1, first_name: 'Jane' }, error: null }) as ReturnType<typeof supabaseAdmin.from>)

    const result = await fetchPatientRecord(1)
    expect(result.success).toBe(true)
  })
})

describe('4.4 fetchPatientBillingHistory — cross-patient access control', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks patient accessing another patient\'s billing', async () => {
    mockValidatePatientAccess.mockResolvedValue({ allowed: false, reason: 'Access denied' })
    const result = await fetchPatientBillingHistory(99)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Access denied')
    expect(result.transactions).toEqual([])
  })

  it('allows access when validatePatientAccess passes', async () => {
    mockValidatePatientAccess.mockResolvedValue({ allowed: true, callerId: 'uid', role: 'staff', callerClinicId: 1 })
    const result = await fetchPatientBillingHistory(1, 1)
    expect(result.success).toBe(true)
  })
})
