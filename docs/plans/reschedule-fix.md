# Fix: Staff Reschedule Appointment Flow

## Problem Summary

When staff clicks "Update Time" to reschedule an appointment:
1. Modal does not close after clicking
2. Status changes to `pending_patient_confirm` correctly ✅
3. No email notification is sent to the patient
4. No notification logged to the `notifications` table

## Root Cause Analysis

### Bug 1: Modal not closing

**Where:** [`AppointmentsClient.tsx:234`](file:///C:/Users/Reymond%20E.%20Billones/capstone-dental-clinic/src/components/features/appointments/AppointmentsClient.tsx#L229-L235)

```tsx
// Current — line 234
onSuccess={refreshAppointments}
```

The `RescheduleModal` calls `onSuccess()` on success ([line 56](file:///C:/Users/Reymond%20E.%20Billones/capstone-dental-clinic/src/components/features/appointments/RescheduleModal.tsx#L55-L56)), but does **not** call `onClose()` itself. The parent's `onSuccess` is wired to `refreshAppointments` (which calls `router.refresh()`), but **never** sets `reschedulingAppt` to `null`.

The modal stays open because `reschedulingAppt` state is never cleared.

**Proof — CalendarClient does it correctly:**
```tsx
// CalendarClient.tsx lines 423-425
onSuccess={() => {
  setReschedulingAppointment(null)  // ← closes modal
  loadMonthData(year, month)
}}
```

### Bug 2 & 3: No email sent, no notification logged

**Where:** [`appointmentActions.ts:277`](file:///C:/Users/Reymond%20E.%20Billones/capstone-dental-clinic/src/actions/appointmentActions.ts#L277)

```typescript
// Line 277 — the gate condition
if (newStatus === 'confirmed' || newStatus === 'rescheduled' || newStatus === 'follow_up') {
```

**`'pending_patient_confirm'` is missing from this condition.**

When staff reschedules, the status is set to `'pending_patient_confirm'` (not `'rescheduled'`). So the entire email + notification block (lines 277–348) is skipped.

The infrastructure is already there:
- `rescheduleEmail` template exists at [`templates.ts:151`](file:///C:/Users/Reymond%20E.%20Billones/capstone-dental-clinic/src/lib/email/templates.ts#L151)
- `logNotification` is already imported ([line 22](file:///C:/Users/Reymond%20E.%20Billones/capstone-dental-clinic/src/actions/appointmentActions.ts#L22))
- `current.scheduled_at` holds the **old** time (fetched at [line 173](file:///C:/Users/Reymond%20E.%20Billones/capstone-dental-clinic/src/actions/appointmentActions.ts#L173) before the update at [line 240](file:///C:/Users/Reymond%20E.%20Billones/capstone-dental-clinic/src/actions/appointmentActions.ts#L240))

## Two Distinct Reschedule Flows

| Flow | Actor | Status Set | Email? | Notification? |
|------|-------|-----------|--------|---------------|
| Patient reschedules (BookingTab) | Patient | `rescheduled` | ✅ | ✅ |
| **Staff reschedules (RescheduleModal)** | **Staff** | **`pending_patient_confirm`** | **❌** | **❌** |

## Exact Changes Required

### Change 1 — Close modal on success

**File:** `src/components/features/appointments/AppointmentsClient.tsx`
**Line:** 234

```diff
-        onSuccess={refreshAppointments}
+        onSuccess={() => { setReschedulingAppt(null); refreshAppointments() }}
```

### Change 2 — Add `pending_patient_confirm` to email/notification gate

**File:** `src/actions/appointmentActions.ts`
**Line:** 277

```diff
-    if (newStatus === 'confirmed' || newStatus === 'rescheduled' || newStatus === 'follow_up') {
+    if (newStatus === 'confirmed' || newStatus === 'rescheduled' || newStatus === 'follow_up' || newStatus === 'pending_patient_confirm') {
```

### Change 3 — Add `pending_patient_confirm` email template branch

**File:** `src/actions/appointmentActions.ts`
**After line 325** (after the `'rescheduled'` else-if block closes)

```diff
           })
+          } else if (newStatus === 'pending_patient_confirm') {
+            triggerType = 'reschedule'
+            const oldDate = new Date(current.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
+            const oldTime = new Date(current.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
+            template = rescheduleEmail({
+              firstName: patient.first_name,
+              oldDate,
+              oldTime,
+              newDate: apptDate,
+              newTime: apptTime,
+              branchName,
+              dentistName,
+            })
           } else {
```

This reuses the exact same `rescheduleEmail` template and `logNotification` call already used by the patient-reschedule flow.

## Files Changed

| File | Lines | What |
|------|-------|------|
| `src/components/features/appointments/AppointmentsClient.tsx` | 234 | Close modal on success |
| `src/actions/appointmentActions.ts` | 277, 325 | Add `pending_patient_confirm` to email gate + template branch |

## Verification

1. `npm run lint` clean
2. `npx tsc --noEmit` clean
3. Staff dashboard → click appointment → "Update Time" → select new date/time → submit
   - Modal should close
   - Status should show `pending_patient_confirm`
   - Patient should receive reschedule email with old & new times
   - `notifications` table should have a new row with `trigger_type: 'reschedule'`
4. Patient dashboard → banner should show with Confirm/Decline buttons
5. Confirm `revalidatePath` covers: `/staff-dashboard/appointments`, `/patient-dashboard/appointments`, `/patient-dashboard/dashboard`, `/patient-dashboard/calendar`, `/dentist-dashboard`
