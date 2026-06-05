# Clinic Backend & Discovery Tasks

## Phase 1: Clinic Profile & Operating Setup
- `[x]` Create `updateClinicProfile` action
- `[x]` Create `updateOperatingHours` action
- `[x]` Create `manageClinicHMOs` action
- `[x]` Create `manageClinicSpecialties` action
- `[x]` Create `manageClinicGallery` action

## Phase 2: Services & Pricing
- `[x]` Create `addService`, `updateService`, `deleteService`, `fetchServices` actions
- `[x]` Create `addProduct`, `updateProduct`, `deleteProduct`, `fetchProducts` actions

## Phase 3: Appointment Management
- `[x]` Create `fetchAppointmentsByDate` action
- `[x]` Create `getAvailableSlots` action
- `[x]` Create `createAppointment` action
- `[x]` Create `updateAppointmentStatus` action
- `[x]` Create `updateMaxAppointments` action

## Phase 4: Patient Records & Walk-ins
- `[x]` Create `registerPatient` action
- `[x]` Create `fetchPatientRecord` action
- `[x]` Create `fetchPatientsByClinic` action
- `[x]` Create `addClinicalAssessment` action
- `[x]` Create `updateDentalChart` action

## Phase 5: Transactions, Discounts & Billing
- `[x]` Create `createTransaction` action
- `[x]` Create `fetchPatientBillingHistory` action
- `[x]` Create `processPayment` action

## Phase 6: Calendar, Inventory, Notifications & Reports
- `[x]` Create `manageClinicHolidays` action
- `[x]` Create `updateInventoryStock`, `fetchStockAlerts`, `logInventoryChange` actions
- `[x]` Create `retriggerNotification` action
- `[x]` Create `generateSalesReport`, `generateAppointmentSummary`, `generateServiceFrequency` actions

## Phase 7: Clinic Discovery & Map (NEW)
- `[x]` Implement Leaflet.js interactive map with custom dental pins
- `[x]` Create unified `ClinicCard` with compact mode and gallery slider
- `[x]` Build real-time filters (Specialty, HMO, Rating, Status) for map and list
- `[x]` Implement synchronized data parity between Map Pins and Sidebar list
- `[x]` Handle safe unmounting and asynchronous initialization to prevent navigation hangs

## Phase 8: System Health & Security (NEW)
- `[x]` Implement server-side `console.error` logging across all 30+ server actions
- `[x]` Resolve "Never-Ending Loading" UI hangs using `finally` blocks in client components
- `[x]` Transition landing page data fetching to secure standardized anon client
- `[x]` Audit and implement missing RLS policies for joined public data
