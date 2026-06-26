# Fix: Missing "Pending Patient Confirm" Status in Staff Dashboard

## 1. Status Filter Dropdown

**File:** `src/components/features/appointments/AppointmentsClient.tsx`
**Lines:** 160-167

**Current List of Options:**
```tsx
<option value="all">All Statuses</option>
<option value="pending">Pending</option>
<option value="confirmed">Confirmed</option>
<option value="rescheduled">Rescheduled</option>
<option value="completed">Completed</option>
<option value="cancelled">Cancelled</option>
<option value="no_show">No-Show</option>
```
**Finding:** `pending_patient_confirm` is completely missing from this filter, making it impossible for staff to filter the appointments list to only show those awaiting patient confirmation.

## 2. Staff Calendar Day Details Raw Status

**File:** `src/components/features/calendar/CalendarClient.tsx`
**Lines:** 368-370

**Current Implementation:**
```tsx
<span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded capitalize">
  {appt.status}
</span>
```
- **Is there a status label formatter/mapper?** No. It just renders `{appt.status}` with `capitalize` CSS class (resulting in "Pending_patient_confirm").
- **Is 'pending_patient_confirm' handled?** No.
- **Is there a color/badge mapping for it?** No. The `bg-blue-50 text-blue-700` styling is hardcoded for *all* statuses regardless of their actual state.

## 3. ALL Places in Staff Dashboard Where It's Missing

1. **Status filter dropdown options:**
   - `src/components/features/appointments/AppointmentsClient.tsx` (Lines 160-167)
2. **Status label display text:**
   - `src/components/features/calendar/CalendarClient.tsx` (Line 369)
3. **Status color/badge mapping:**
   - `src/components/features/calendar/CalendarClient.tsx` (Line 368 - hardcoded blue for all)
4. **Status-based conditional logic (Action Buttons):**
   - `src/components/features/calendar/CalendarClient.tsx` (Line 360)
     ```tsx
     const showActions = userId && role && (appt.status === 'pending' || appt.status === 'confirmed' || appt.status === 'rescheduled')
     ```
     Because `pending_patient_confirm` is excluded from `showActions`, no action buttons (like Reschedule or Cancel) are shown in the Day Details view for these appointments, preventing staff from further managing them from the calendar.
   - `src/components/features/calendar/CalendarClient.tsx` (Line 381)
     ```tsx
     {(appt.status === 'pending' || appt.status === 'rescheduled') && (
     ```
     This check for the `Approve` button also excludes it. Staff should ideally be able to manage this state similar to standard `pending` or `rescheduled` states.
