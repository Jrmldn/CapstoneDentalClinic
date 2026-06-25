Refactor the appointment booking and patient registration flows 
to eliminate duplication and clarify each flow's purpose.

CURRENT STATE:
- Book Appointment modal has two modes: Select Existing Patient 
  and Register New Walk-in Patient (inline form)
- Patient Directory has a Register Patient modal with full 
  medical profile

TARGET STATE:

1. BOOK APPOINTMENT MODAL — Simplify to existing patients only
- Remove the "Register New Walk-in Patient" link and inline 
  registration form from the Book Appointment modal entirely
- The modal should only allow selecting an existing patient 
  from the dropdown
- Add a separate "Walk-in Appointment" button (outside the modal) 
  on the appointments page

2. WALK-IN APPOINTMENT — New dedicated flow
- Add a "Walk-in Appointment" button on the appointments page 
  alongside the existing "Book Appointment" button
- Opens a new WalkInModal with minimal fields:
  - First Name, Last Name, Phone (required)
  - Service, Dentist, Date, Available Slot (required)
  - Downpayment, Notes (optional)
- Creates patient record (no auth account) + books appointment 
  in one action
- Marks appointment as is_walkin = true in DB
- Patient record marked with no login credentials

3. PATIENT DIRECTORY — Full registration only
- Keep Register Patient modal as-is with full medical profile
- After successful registration show a prompt/toast:
  "Patient registered successfully. Book an appointment?"
  with a "Book Now" button that opens the Book Appointment 
  modal with that patient pre-selected
- No changes to the registration form itself

4. SERVER ACTIONS
- Create a new registerWalkInPatientAndBook() server action that:
  - Creates patient record (no Supabase auth user)
  - Books appointment in one transaction
  - Marks appointment is_walkin = true
  - ensureRole('staff')
- Keep existing bookAppointment() and registerPatient() 
  actions unchanged

5. DB
- Confirm is_walkin boolean column exists on appointments table
  (add if missing, default false)

Run lint after all changes.
Do not change any existing booking or registration logic —
only restructure the UI flows and add the new walk-in action.