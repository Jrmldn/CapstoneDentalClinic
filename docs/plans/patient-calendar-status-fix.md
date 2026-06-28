# Patient Dashboard Calendar Status Investigation

## Issue Summary
On the patient dashboard calendar (`CalendarTab.tsx`), the appointment status `pending_patient_confirm` displays incorrectly as a grey badge with the raw database string `"Pending_patient_confirm"`.

## Investigation Findings

### 1. Legend Component on the Patient Calendar
- **Location:** `src/app/patient-dashboard/_components/CalendarTab.tsx` (Lines 87-101)
- **Included Statuses:** Confirmed, Pending, Rescheduled, Completed, No Show.
- **Is `pending_patient_confirm` included?** **NO.** It is missing from the calendar's legend.

### 2. Status Badge & Color Mapping
- **Location:** `src/app/patient-dashboard/_components/CalendarTab.tsx` (`getStatusColor` function, Lines 61-71)
- **Is `pending_patient_confirm` in the mapping?** **NO.** It falls through to the default switch case, returning a generic grey dot and badge (`bg-gray-300` and `bg-gray-50 text-gray-600 border-gray-200`).
- **Expected Color:** According to `src/app/patient-dashboard/_components/utils.tsx` (used by the Appointments list tab), this status uses a purple theme. In the calendar's palette style, it should be added as: `{ dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-200' }`.

### 3. Status Label Formatting
- **Location:** `src/app/patient-dashboard/_components/CalendarTab.tsx` (Lines 226-228)
- **Current Rendering:** The component directly renders the raw database value `{appt.status}` inside a `<span>` with a `capitalize` CSS class.
- **Expected Rendering:** It needs a helper or conditional formatting to display a clean string like `"Confirm Reschedule"` (as defined in `getStatusBadge` from `utils.tsx`) or `"Pending Confirmation"`.

### 4. Banner / Notification Logic
- **Location:** `src/app/patient-dashboard/_components/AppointmentsTab.tsx` (Lines 123-155)
- **Does the banner exist?** **YES.** In the `AppointmentsTab` (the list view), there is a purple banner stating: *"The clinic rescheduled your appointment to a new time."* along with the new time details.
- **Is it wired up?** **YES.** It includes fully functional "Confirm" and "Decline" buttons wired to `handleConfirmReschedule` and `handleDeclineReschedule`.
- **The Core Issue:** This banner is **only** implemented in the `AppointmentsTab` list view. It is completely missing from `CalendarTab.tsx`, meaning a patient exclusively using the calendar view would not see the prominent prompt to confirm their rescheduled appointment.
