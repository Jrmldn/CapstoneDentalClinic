/plan

Investigate and fix all flaws and errors related to 
appointments across Patient, Staff, and Dentist portals.

IMPORTANT: Read and investigate all files first.
Do not change anything until the full investigation 
is complete and plan is confirmed.

═══════════════════════════════════════════
INVESTIGATE — PATIENT PORTAL
═══════════════════════════════════════════

1. My Appointments page
   - Are all appointment statuses showing correct 
     badges and colors?
   - Is 'pending_patient_confirm' showing correctly?
   - Are Confirm/Decline buttons working?
   - Are any statuses missing from the list?
   - Is the banner showing for pending_patient_confirm?

2. My Calendar page
   - Is 'pending_patient_confirm' in legend?
   - Is color/badge mapping correct for all statuses?
   - Is label formatting correct (no raw underscore text)?
   - Is the confirm/decline banner showing in Day Details?
   - Are Confirm/Decline buttons wired correctly?

3. Book Appointment flow
   - Any errors or missing validations?
   - Does downpayment show correctly?
   - Are available slots loading correctly?

4. Dashboard
   - Are upcoming appointments showing all statuses?
   - Is pending_patient_confirm shown correctly?

═══════════════════════════════════════════
INVESTIGATE — STAFF PORTAL
═══════════════════════════════════════════

1. Appointments page
   - Is 'pending_patient_confirm' in status filter dropdown?
   - Is badge/color mapping correct for all statuses?
   - Are correct action buttons showing per status:
     - pending → Approve, Reschedule, Cancel, No Show
     - confirmed → Reschedule, Complete & Bill, Cancel, No Show
     - pending_patient_confirm → Reschedule, Cancel
     - rescheduled → Reschedule, Cancel
     - completed → no actions needed
     - cancelled → no actions needed
     - no_show → no actions needed
   - Any missing or incorrect action buttons?

2. Calendar page
   - Is 'pending_patient_confirm' in showActions condition?
   - Is label formatter handling all statuses correctly?
   - Is color/badge mapping correct for all statuses?
   - Are correct action buttons showing in Day Details?

3. Book Appointment modal
   - Any errors or missing validations?
   - Walk-in flow working correctly?

4. Dashboard
   - Are stats counting correctly?
   - Is pending_patient_confirm counted anywhere?

═══════════════════════════════════════════
INVESTIGATE — DENTIST PORTAL
═══════════════════════════════════════════

1. My Appointments page
   - Is 'pending_patient_confirm' in status filter dropdown?
   - Is badge/color mapping correct for all statuses?
   - Are correct action buttons showing per status:
     - pending → Approve, No Show, Cancel
     - confirmed → Complete & Send to Billing, No Show, Cancel
     - pending_patient_confirm → Reschedule, Cancel
     - rescheduled → No actions or Cancel only?
   - Any missing or incorrect action buttons?

2. Calendar page
   - Is it same component as staff or separate?
   - Is 'pending_patient_confirm' handled?
   - Is label formatter handling all statuses?
   - Are correct action buttons showing in Day Details?

3. Dashboard
   - Upcoming Queue — does it show pending_patient_confirm?
   - Are stats (Today's Appointments, Pending, Completed) 
     counting correctly?
   - Is pending_patient_confirm counted in any stat?

═══════════════════════════════════════════
CROSS-PORTAL CONSISTENCY CHECK
═══════════════════════════════════════════

1. Are status colors consistent across all portals?
   - pending → yellow
   - confirmed → green
   - pending_patient_confirm → purple
   - rescheduled → blue
   - completed → gray
   - cancelled → red
   - no_show → orange

2. Are status labels consistent across all portals?
   - No raw underscore text anywhere
   - Human readable labels everywhere

3. Are shared components being used or are there 
   duplicate implementations?
   - List all shared vs separate components

4. Is the notification sent correctly for each 
   status change? Check:
   - confirmed → booking confirmation email
   - pending_patient_confirm → reschedule email
   - follow_up → follow up email

═══════════════════════════════════════════
REPORT FORMAT
═══════════════════════════════════════════

For each issue found, report:
- Portal (Patient/Staff/Dentist)
- File path and line number
- Current behavior
- Expected behavior
- Severity (Critical/Major/Minor)

Group by portal then by severity.

DO NOT change any files during investigation.
DO NOT fix anything yet.
INVESTIGATE AND REPORT ONLY.

═══════════════════════════════════════════
DOCUMENTATION
═══════════════════════════════════════════

After investigation is complete, create:
docs/plans/appointment-portal-audit.md

Include:
- Full findings report grouped by portal
- List of all files that need changes
- Recommended fix order (critical first)
- Verification checklist per portal