# Clinic Backend Implementation Plan

This plan outlines the backend architecture and server actions for the comprehensive Clinic Management System. The plan is divided into 6 modular phases that align with the provided database schema. We prioritize DRY principles, scalability, and secure server actions.

## User Review Required

Please review the proposed server actions mapping to ensure it fully covers your frontend requirements. 

> [!NOTE]
> We will adapt some of your phase requirements to use the existing normalized database tables (e.g., instead of adding `opening_time` to the `clinics` table, we will use the existing `clinic_operating_hours` table; `is_guest` is natively supported in the `patients` table, etc.). 

## Proposed Changes

We will separate the backend logic into domain-specific action files inside `src/actions/` to keep the code modular and scalable.

### Phase 1: Clinic Profile & Operating Setup
**DB Alignment:**
- `clinics` table exists with `manual_status` and `default_downpayment_amount`.
- Operating hours are normalized in `clinic_operating_hours`.
- HMOs are in `clinic_hmo`. Images are in `clinic_gallery`.
- Specialties are in `clinic_specialties`.

**Server Actions (`src/actions/clinicSetupActions.ts`):**
- `updateClinicProfile`: Update basic clinic details (name, address, max appointments, default downpayment).
- `updateOperatingHours`: Upsert records in `clinic_operating_hours`.
- `manageClinicHMOs`: Add/remove records from `clinic_hmo`.
- `manageClinicSpecialties`: Add/remove records from `clinic_specialties`.
- `manageClinicGallery`: Handle upload/reordering in `clinic_gallery`.

### Phase 2: Services & Pricing
**DB Alignment:**
- `services` table exists with `slot_duration_min` per service.
- `products` table exists for physical inventory pricing.

**Server Actions (`src/actions/serviceActions.ts`):**
- `addService`, `updateService`, `deleteService`, `fetchServices`: CRUD operations for `services`.
- `addProduct`, `updateProduct`, `deleteProduct`, `fetchProducts`: CRUD operations for `products`.

### Phase 3: Appointment Management
**DB Alignment:**
- `appointments` table tracks status, scheduling (`scheduled_at`, `end_at`), and payment (`downpayment`, `payment_status`, `is_walk_in`).
- Slot generation will dynamically query `clinic_operating_hours`, `dentist_availability`, `dentist_blocked_slots`, and existing `appointments`.

**Server Actions (`src/actions/appointmentActions.ts`):**
- `fetchAppointmentsByDate`: Retrieves appointments for a specific day/range.
- `getAvailableSlots`: Generates slots dynamically based on service duration and clinic/dentist availability.
- `createAppointment`: Books an appointment (handles downpayment logic).
- `updateAppointmentStatus`: Manages status (Rescheduled, Completed, Cancelled, No-Show) and logs to `appointment_logs`.
- `updateMaxAppointments`: Updates `max_appointments_per_day` in `clinics`.

### Phase 4: Patient Records & Walk-ins
**DB Alignment:**
- `patients` (has `is_guest`), `patient_medical_history`, `clinical_assessments`, `dental_charts`, `tooth_conditions`, `treatment_history`.

**Server Actions (`src/actions/patientActions.ts`):**
- `registerPatient`: Registers a new patient (walk-in/guest or full user) and records medical history. Will book them into a vacant hour if required.
- `fetchPatientRecord`: Full aggregation of patient info, history, assessments, and dental charts.
- `fetchPatientsByClinic`: Alphabetical list of patients for a clinic.
- `addClinicalAssessment`: Records assessment details.
- `updateDentalChart`: Adds/updates `tooth_conditions`.

### Phase 5: Transactions, Discounts & Billing
**DB Alignment:**
- `transactions` and `transaction_items` cover total billing, discounts (HMO, PWD/Senior, PhilHealth), and sub-items (services, products).

**Server Actions (`src/actions/billingActions.ts`):**
- `createTransaction`: Compiles items (`transaction_items`), applies discounts, calculates totals.
- `fetchPatientBillingHistory`: Retrieves past transactions and treatment history.
- `processPayment`: Updates transaction and appointment payment status.

### Phase 6: Calendar, Inventory, Notifications & Reports
**DB Alignment:**
- Calendar uses `clinic_holidays` (for special days/closures) and `appointments`.
- Inventory uses `inventory_items` and `inventory_logs`.
- Notifications use `notifications` table.

**Server Actions (`src/actions/managementActions.ts`):**
- **Calendar:** `manageClinicHolidays` (add/remove holidays/special days).
- **Inventory:** `updateInventoryStock`, `fetchStockAlerts` (based on `alert_threshold`), `logInventoryChange`.
- **Notifications:** `retriggerNotification` (resends failed SMS/email based on `notifications` table status).
- **Reports:** `generateSalesReport`, `generateAppointmentSummary`, `generateServiceFrequency` (returns data ready for PDF generation on frontend).

## Verification Plan

### Automated Tests
- Server action response validations for slot generation logic (`getAvailableSlots`) to ensure accurate booking windows and overlap prevention.
- Validation for transaction calculations (discounts, subtotals, grand totals).

### Manual Verification
- Walk through the guest patient registration flow and verify automatic slot assignment.
- Verify status transition logs are accurately captured in `appointment_logs`.
- Test inventory deduction and low-stock alerts threshold functionality.
