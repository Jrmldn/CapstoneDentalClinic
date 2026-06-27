# Appointments Query Audit — Complete Cross-Portal Analysis

**Date:** 2026-06-26  
**Scope:** All appointment queries across dentist, staff, and calendar portals  
**Status:** Investigation complete — no changes made

---

## ISSUE OVERVIEW

Three distinct problems identified:

1. **Dentist Dashboard "Today's Schedule"** — Hides unpaid online bookings via payment_status filter
2. **Staff Appointments Page** — Hides unpaid online bookings via client-side filter (different from calendar)
3. **Dentist Appointments Page** — "Complete & Send to Billing" button timezone issue and missing status guard

---

## PART 1: STAFF APPOINTMENTS PAGE — Missing Appointments Discrepancy

### Problem
Staff Appointments page shows **1 appointment** on Jun 26 but Staff Calendar shows **4**.

### Root Cause
**Two-layer filtering approach:**

| Layer | Filter | Hidden Appointments |
|-------|--------|-------------------|
| Server Query | clinic_id only | None — fetches all clinic appointments |
| Client-Side | `payment_status === 'unpaid' && !is_walk_in` | 3 unpaid online bookings |
| **Result** | Combined | 1 visible (walk-in OR paid) |

### Code Details

**Server Query — `src/app/staff-dashboard/appointments/page.tsx` (Lines 27-44)**
```tsx
const appointmentsRes = await supabaseAdmin
  .from('appointments')
  .select(['id', 'scheduled_at', 'end_at', 'status', 'notes', 'is_walk_in', 'downpayment', 'payment_method', 'payment_status', 'patients', 'services', 'dentists'])
  .eq('clinic_id', clinicId)
  .order('scheduled_at', { ascending: false })
```
✓ Correctly fetches all clinic appointments (no dentist_id filter)

**Client-Side Filter — `src/components/features/appointments/AppointmentsClient.tsx` (Lines 112-114)**
```tsx
const filteredAppointments = appointments.filter(appt => {
  // Hide unpaid online bookings until downpayment is confirmed
  if (appt.payment_status === 'unpaid' && !appt.is_walk_in) return false
  // ... additional filters for date, status, search
})
```
✗ **ISSUE:** This filter hides unpaid online bookings from the staff appointments list

**Calendar Query — `src/actions/calendarActions.ts` (Lines 112-128)**
```ts
let appointmentsQuery = supabaseAdmin
  .from('appointments')
  .select(['id', 'scheduled_at', 'end_at', 'status', 'dentist_id', 'patients', 'services', 'dentists'])
  .eq('clinic_id', clinicId)
  .gte('scheduled_at', queryStart)
  .lte('scheduled_at', queryEnd)
  .not('status', 'in', '(cancelled,no_show)')
  .order('scheduled_at', { ascending: true })

// Optional dentist filter
if (dentistId) {
  appointmentsQuery = appointmentsQuery.eq('dentist_id', dentistId)
}
```
✓ Correct — no payment_status filter; excludes only cancelled/no_show

---

## PART 2: DENTIST DASHBOARD "TODAY'S SCHEDULE" — Missing Appointments

### Problem
Dentist Dashboard "Today's Schedule" hides unpaid online bookings even though calendar shows them.

### Root Cause
Explicit `payment_status` filter applied at the **page.tsx level** after server fetch.

### Code Details

**Server Query — `src/services/dashboardService.ts` (Lines 85-92)**
```ts
supabaseAdmin
  .from('appointments')
  .select('id, scheduled_at, status, payment_status, is_walk_in, downpayment, patients ( id, first_name, last_name, phone ), services ( id, name, price )')
  .eq('dentist_id', dentistId)
  .eq('clinic_id', clinicId)
  .gte('scheduled_at', `${today}T00:00:00+08:00`)
  .lte('scheduled_at', `${today}T23:59:59+08:00`)
  .order('scheduled_at', { ascending: true })
```
✓ Correct — proper clinic/dentist filtering, Manila timezone bounds

**Post-Fetch Filter — `src/app/dentist-dashboard/page.tsx` (Line 59)**
```tsx
const todayAppts: Appointment[] = todayApptsRaw
  .map(appt => ({...}))
  .filter(a => a.payment_status !== 'unpaid' || a.is_walk_in)
```
✗ **ISSUE:** Hides unpaid online bookings from today's schedule

**Dashboard Description/Empty State — `src/components/features/dashboard/DentistDashboardView.tsx`**
- **Subtitle:** "Local Queue" (Line 243)
- **Empty State:** "No appointments scheduled today" (Line 249)

---

## PART 3: DENTIST APPOINTMENTS PAGE — Complete & Send to Billing Condition

### Problem
"Complete & Send to Billing" button is greyed out for future-dated confirmed appointments — correct. However, the date comparison uses browser local timezone, not Manila timezone.

### Code Details

**Button Condition — `src/app/dentist-dashboard/appointments/DentistAppointmentsClient.tsx` (Lines 31-37, 176-193)**

```tsx
function isPastOrToday(scheduledAt: string): boolean {
  const d = new Date(scheduledAt)
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return day.getTime() <= today.getTime()
}
```

**Button Rendering:**
```tsx
{appt.status === 'confirmed' && (
  isPastOrToday(appt.scheduled_at) ? (
    <button onClick={() => setCompletingAppt(appt)} ...>
      Complete & Send to Billing
    </button>
  ) : (
    <button disabled title="Available on the appointment date." ...>
      Complete & Send to Billing
    </button>
  )
)}
```

**Issues:**
1. `new Date(scheduledAt)` parses UTC and converts to **browser's local timezone** — if browser ≠ Asia/Manila, date extraction can be off by 1 day
2. No **status guard** — button condition checks `status === 'confirmed'` but doesn't verify it should only appear for non-terminal statuses
3. **Missing status check on today's appointments** — dashboard version (DentistDashboardView.tsx lines 364–370) has no date guard at all; button is always active for confirmed appointments

---

## PART 4: COMPREHENSIVE QUERY FILTER SUMMARY

| Portal | File Path | Dentist Filter | Payment Filter | Status Filter | Date Range | Notes |
|--------|-----------|----------------|----------------|---------------|-----------|-------|
| **Staff Appointments** | `src/app/staff-dashboard/appointments/page.tsx` | ✗ No | ✓ Client-side (hides unpaid online) | ✗ No | ✗ No | All clinic appts, unpaid online hidden by client |
| **Staff Calendar** | `src/actions/calendarActions.ts` | ✗ No (optional param) | ✗ No | ✓ Excludes cancelled, no_show | ✓ Calendar month ±1 day | All clinic appts, correct status filter |
| **Dentist Appointments** | `src/app/dentist-dashboard/appointments/page.tsx` | ✓ Yes | ✗ No (fetched) | ✗ No | ✗ No | Dentist-only, no payment filter |
| **Dentist Calendar** | `src/actions/calendarActions.ts` | ✓ Yes | ✗ No | ✓ Excludes cancelled, no_show | ✓ Calendar month ±1 day | Dentist-only, correct status filter |
| **Dentist Dashboard Today** | `src/services/dashboardService.ts` → `src/app/dentist-dashboard/page.tsx` | ✓ Yes | ✓ Post-fetch (hides unpaid online) | ✗ No | ✓ Today only (Manila TZ) | **INCONSISTENT with calendar** |
| **Staff Dashboard Today** | `src/services/dashboardService.ts` → `src/app/staff-dashboard/page.tsx` | ✗ No | ✗ No | ✓ Excludes cancelled, no_show | ✓ Today only (Manila TZ) | Consistent with staff calendar |

---

## PART 5: DASHBOARD DESCRIPTION TEXT & EMPTY STATES

### Dentist Dashboard
- **Component:** `src/components/features/dashboard/DentistDashboardView.tsx`
- **Section Title:** "Today's Schedule"
- **Subtitle:** "Local Queue" (Line 243)
- **Empty State Message:** "No appointments scheduled today" (Line 249)

### Staff Dashboard
- **Component:** `src/components/features/dashboard/StaffDashboardView.tsx`
- **Section Title:** "Today's Schedule"
- **Subtitle:** "View all" (Line 112 — appears as a link)
- **Empty State Message:** "No appointments today" (Line 119)

---

## KEY FINDINGS & INCONSISTENCIES

### 1. Payment Status Filter Inconsistency
- **Dentist Dashboard Today:** Filters out unpaid online bookings (`payment_status !== 'unpaid' || is_walk_in`)
- **Dentist Calendar:** Shows unpaid online bookings (only excludes cancelled/no_show)
- **Staff Dashboard Today:** Shows unpaid online bookings (excludes only cancelled/no_show)
- **Staff Appointments Page:** Hides unpaid online bookings (client-side filter)
- **Staff Calendar:** Shows unpaid online bookings (database-level filter)

**Issue:** Dentist's dashboard today view inconsistent with dentist's calendar view. Staff's page view inconsistent with staff's calendar view.

### 2. Status Filter Inconsistency
- **Calendar queries:** Explicitly exclude `cancelled` and `no_show` at database level
- **Dashboard today queries:** NO database-level status filter
- **Appointments list queries:** NO status filter

**Issue:** Cancelled/no_show appointments could appear in dashboard and list views but not calendar.

### 3. Timezone Handling
- **Dashboard queries:** Use explicit Manila timezone bounds (`+08:00`)
- **isPastOrToday function:** Uses browser local timezone (no explicit timezone)

**Issue:** If browser timezone ≠ Asia/Manila, same-day/past-day boundary could be miscomputed.

---

## RECOMMENDATIONS FOR FIXES

### Fix 1: Remove payment_status filter from Dentist Dashboard Today
**File:** `src/app/dentist-dashboard/page.tsx` (Line 59)

**Current:**
```tsx
.filter(a => a.payment_status !== 'unpaid' || a.is_walk_in)
```

**Should be:** (show all booked appointments regardless of payment)
```tsx
.filter(a => !['cancelled', 'no_show'].includes(a.status))
```

### Fix 2: Remove payment_status filter from Staff Appointments Page
**File:** `src/components/features/appointments/AppointmentsClient.tsx` (Line 114)

**Current:**
```tsx
if (appt.payment_status === 'unpaid' && !appt.is_walk_in) return false
```

**Should be:** (remove this filter OR make it optional/configurable)
```tsx
// Show all appointments — staff should see unpaid bookings to follow up on payment
```

### Fix 3: Fix timezone in isPastOrToday function
**File:** `src/app/dentist-dashboard/appointments/DentistAppointmentsClient.tsx` (Lines 31-37)

**Current:**
```tsx
function isPastOrToday(scheduledAt: string): boolean {
  const d = new Date(scheduledAt)
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return day.getTime() <= today.getTime()
}
```

**Should be:** (use Manila timezone)
```tsx
import { toDateKey } from '@/lib/date'

function isPastOrToday(scheduledAt: string): boolean {
  return toDateKey(scheduledAt) <= toDateKey()
}
```

### Fix 4: Add status filter to calendar queries (optional, but consistent)
**Files:**
- `src/services/dashboardService.ts` — getStaffDashboardData & getDentistDashboardData
- `src/app/staff-dashboard/appointments/page.tsx` & `src/app/dentist-dashboard/appointments/page.tsx`

**Recommendation:** Add `.not('status', 'in', '(cancelled,no_show)')` to appointment list queries to match calendar behavior.

---

## VERIFICATION CHECKLIST

- [ ] Book online appointment (pending, unpaid)
- [ ] Verify appears on **Dentist Calendar** ✓
- [ ] Verify appears on **Dentist Dashboard Today's Schedule** (currently hidden)
- [ ] Verify appears on **Dentist Appointments List** ✓
- [ ] Verify appears on **Staff Calendar** ✓
- [ ] Verify appears on **Staff Dashboard Today's Schedule** ✓
- [ ] Verify appears on **Staff Appointments List** (currently hidden)
- [ ] Patient pays downpayment online → `payment_status` → `downpaid`
- [ ] Verify appointment reappears on Staff/Dentist Appointments List (client filter removes "unpaid" check)
- [ ] Dentist approves → `status` → `confirmed`
- [ ] Verify "Complete & Send to Billing" is active on today's appointment
- [ ] Verify "Complete & Send to Billing" is greyed out for future-dated appointment
- [ ] Check timezone edge cases near midnight PH time

---

## Files Modified

None — **investigation and reporting only**, per requirements.

