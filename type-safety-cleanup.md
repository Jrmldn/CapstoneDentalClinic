 Ready to code?                                                                                                                        ↑

   Here is Claude's plan:                                                                                                                ↑
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
   Plan: Type-Safety & Code-Quality Cleanup                                                                                              ↑

   Context                                                                                                                               ↑

   The codebase audit (q.md) identified ~103 issues across 17 categories. Native-dialog issues are temporarily allowed per CLAUDE.md update. This plan addresses the remaining type-safety and code-smell issues in 4 steps, verified with npx tsc --noEmit after each major step.                                                                                                                                 ↑

   ---                                                                                                                                   ↑
   Step 1: normalizeRelation utility — ALREADY EXISTS
                                                                                                                                         ↑
   src/lib/utils.ts:8-11 already exports:
   export function normalizeRelation<T>(r: T | T[] | null): T | null {                                                                   ↑
     if (r === null || r === undefined) return null;
     return Array.isArray(r) ? (r[0] ?? null) : r;                                                                                       ↑
   }
   No action needed. Move to Step 2.                                                                                                     ↑

   ---                                                                                                                                   ↑
   Step 2: Replace inline Array.isArray() checks (~28 instances, 12 files)
                                                                                                                                         ↑
   Pattern to replace everywhere:
   // BEFORE                                                                                                                             ↑
   const x = Array.isArray(foo.bar) ? foo.bar[0] : foo.bar
   // AFTER                                                                                                                              ↑
   const x = normalizeRelation(foo.bar)
   Add import { normalizeRelation } from '@/lib/utils' if not already imported.                                                          ↑

   Files and locations:                                                                                                                  ↑
   ┌─────────────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────┐
   │                                    File                                     │                Relations to normalize                │↑
   ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
   │ src/utils/personnel-helpers.ts:31-32, 51-52                                 │ staff.users, staff.clinics, dentist.users,           │↑
   │                                                                             │ dentist.clinics                                      │
   ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤↑
   │ src/actions/appointmentActions.ts:291-293                                   │ apptData.patients, apptData.dentists,                │
   │                                                                             │ apptData.clinics                                     │↑
   ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
   │ src/components/features/calendar/CalendarClient.tsx:349-351                 │ appt.patients, appt.services, appt.dentists          │↑
   ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
   │ src/app/staff-dashboard/appointments/page.tsx:51-53                         │ appt.patients, appt.services, appt.dentists          │↑
   ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
   │ src/components/features/patients/TreatmentTab.tsx:240, 307                  │ treat.dentists, treat.clinics                        │↑
   ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
   │ src/components/features/patients/PrescriptionsTab.tsx:121, 291, 321         │ pres.dentists (twice), pres.clinics                  │↑
   ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
   │ src/components/features/patients/FollowupsTab.tsx:252-253, 282              │ appt.dentists, appt.services, appt.clinics           │↑
   ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
   │ src/components/features/patients/DentalChartTab.tsx:448-449                 │ latestChart.dentists, latestChart.clinics            │↑
   ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
   │ src/components/features/billing/CreateInvoiceModal.tsx:94-95, 130, 152,     │ appointment.patients, appointment.services (multiple │↑
   │ 351-352                                                                     │  sites)                                              │
   ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤↑
   │ src/app/staff-dashboard/layout.tsx:26                                       │ staffRecord.clinics                                  │
   ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤↑
   │ src/actions/reportActions.ts:147                                            │ appt.services                                        │
   └─────────────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────┘↑

   Verify: npx tsc --noEmit after all replacements.                                                                                      ↑

   ---                                                                                                                                   ↑
   Step 3: Fix as never and as unknown as X casts (22 instances)
                                                                                                                                         ↑
   3a. Enum string parameters → typed enums (easiest, highest leverage)
                                                                                                                                         ↑
   Root cause: Function params typed as string where Supabase expects Enums<'...'>.
                                                                                                                                         ↑
   Fix: Import Enums from @/database/supabase-types and narrow param types.
                                                                                                                                         ↑
   ┌──────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────┐
   │                     File                     │                                       Change                                        │↑
   ├──────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
   │ src/actions/notificationActions.ts:62        │ triggerType?: string → triggerType?: Enums<'notification_trigger'>                  │↑
   ├──────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
   │ src/lib/notifications/logNotification.ts:22  │ triggerType: string → triggerType: Enums<'notification_trigger'>                    │↑
   ├──────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
   │ src/services/billingService.ts:56, 70,       │ paymentStatus: string, paymentMethod: string → Enums<'payment_status'>,             │↑
   │ 134-135                                      │ Enums<'payment_method'> in function signatures and TransactionHeaderInsertData      │
   │                                              │ interface                                                                           │↑
   └──────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                                                         ↑
   Once params are typed, remove the as never casts from the Supabase calls.
                                                                                                                                         ↑
   3b. Record<string, unknown> / untyped insert data → TablesInsert/TablesUpdate
                                                                                                                                         ↑
   ┌────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────┐
   │                  File                  │                                           Change                                           ↑
   ├────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
   │ src/services/appointmentService.ts:141 │ CreateAppointmentInsertData → TablesInsert<'appointments'> (or align interface's enum      ↑
   │                                        │ fields)                                                                                    │
   ├────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────↑
   │ src/services/appointmentService.ts:152 │ AppointmentLogInsertData → TablesInsert<'appointment_logs'>                                │
   ├────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────↑
   │ src/services/appointmentService.ts:175 │ updateData: Record<string, unknown> → TablesUpdate<'appointments'>                         │
   ├────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────↑
   │ src/services/billingService.ts:35      │ TransactionHeaderInsertData — replace payment_method: string and payment_status: string    │
   │                                        │ with enum types                                                                            ↑
   ├────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
   │ src/services/installmentService.ts:88  │ updateData: Record<string, unknown> → TablesUpdate<'installment_payments'>                 ↑
   └────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                                                         ↑
   3c. Union table branch — personnelService
                                                                                                                                         ↑
   src/services/personnelService.ts:237 — table: 'clinic_staff' | 'dentists' union prevents Supabase from typing .update(). Fix by branching:                                                                                                                            ↑
   if (table === 'clinic_staff') {
     const { specialty: _, ...staffPayload } = payload                                                                                   ↑
     return supabaseAdmin.from('clinic_staff').update(staffPayload).eq('user_id', userId)
   } else {                                                                                                                              ↑
     return supabaseAdmin.from('dentists').update(payload).eq('user_id', userId)
   }                                                                                                                                     ↑

   3d. fetchPatientRecord explicit return type → eliminate 6 page.tsx double-casts                                                       ↑

   src/actions/patientMedicalActions.ts (or wherever fetchPatientRecord is defined):                                                     ↑
   - Import PatientRecord from src/app/patient-dashboard/_components/types.ts
   - Annotate the return type as Promise<{ success: true; record: PatientRecord } | { success: false; error: string; record: null }>     ↑
   - This eliminates all 6 as unknown as PatientRecord casts in src/app/patient-dashboard/**/page.tsx
                                                                                                                                         ↑
   3e. Remaining as unknown as X — targeted fixes
                                                                                                                                         ↑
   ┌──────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────┐
   │                   File                   │                                           Fix                                            ↑
   ├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
   │ src/actions/inventoryActions.ts:135      │ Use QueryData<typeof inventoryQuery> from @supabase/supabase-js for InventoryItemRaw, or ↑
   │                                          │  keep the intermediate type but widen it to match Supabase's actual join shape           │
   ├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────↑
   │ src/actions/installmentActions.ts:59     │ Use QueryData<typeof txQuery> for TransactionTermsRow                                    │
   ├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────↑
   │ src/actions/reportActions.ts:41          │ Add philhealth_coverage?: number to SalesTransaction interface; remove inner as unknown  │
   │                                          │ as { philhealth_coverage?: number } cast                                                 ↑
   ├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
   │ src/actions/reportActions.ts:94          │ ApptRow → use Pick<Tables<'appointments'>, 'status' | 'is_walk_in'>[]; no cast needed    ↑
   ├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
   │ src/actions/patientMedicalActions.ts:214 │ Access medHistoryRes.data fields by property name via Tables<'patient_medical_history'>  ↑
   │                                          │ rather than Record<string, ...> index access                                             │
   └──────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────↑

   Verify: npx tsc --noEmit after all Step 3 changes.                                                                                    ↑

   ---                                                                                                                                   ↑
   Step 4: Low-hanging fruit
                                                                                                                                         ↑
   4a. Extract className ternaries with >2 branches
                                                                                                                                         ↑
   src/components/features/inventory/InventoryClient.tsx
   Extract above component:                                                                                                              ↑
   function getExpiryColor(expired: boolean, soon: boolean): string {
     if (expired) return 'text-red-600'                                                                                                  ↑
     if (soon) return 'text-amber-600'
     return 'text-slate-600'                                                                                                             ↑
   }
   Replace inline ternary: className={text-sm font-medium ${getExpiryColor(expired, soon)}}                                              ↑

   src/app/dentist-dashboard/availability/AvailabilityClient.tsx                                                                         ↑
   Extract:
   function getDayTextColor(hasFullBlock: boolean, hasLeave: boolean): string {                                                          ↑
     if (hasFullBlock) return 'text-red-700'
     if (hasLeave) return 'text-purple-700'                                                                                              ↑
     return 'text-slate-800'
   }                                                                                                                                     ↑
   Replace inline ternary on line 178.
                                                                                                                                         ↑
   4b. Consolidate duplicate ClinicHoliday interface
                                                                                                                                         ↑
   Create src/app/superadmin-dashboard/clinic/[id]/profile/_components/types.ts:
   export interface ClinicHoliday {                                                                                                      ↑
     id: number
     date: string                                                                                                                        ↑
     description: string | null
     is_special_day: boolean | null                                                                                                      ↑
   }
   Update ProfileTabs.tsx and HolidaysForm.tsx to import from this file instead of defining locally.                                     ↑

   4c. Remove console.log from resend.ts                                                                                                 ↑

   src/lib/email/resend.ts:24 — Replace console.log(...) with console.warn('[email stub] skipping send — no RESEND_API_KEY'). Avoids leaking PII (opts.to, opts.subject) to logs. Do not log the recipient or subject in stub mode.
                                                                                                                                         ↑
   4d. Fix non-null assertions with guard clauses
                                                                                                                                         ↑
   src/components/features/patients/usePatientRecord.ts:127, 129
   Add at top of handleAddAssessmentSubmit:                                                                                              ↑
   if (!localRecord) return
   if (!dentistId) return                                                                                                                ↑
   Then remove localRecord! and dentistId!.
                                                                                                                                         ↑
   src/components/features/billing/CreateInvoiceModal.tsx:113
   Change const isRange = fullSvc && ... to const isRange = !!fullSvc && ... — TypeScript then narrows fullSvc in the truthy branch, eliminating fullSvc!.price_min!.
                                                                                                                                         ↑
   src/components/features/appointments/DentistCompleteBillingModal.tsx:205-213
   Same fix: const hasRange = !!selectedService && ... to produce a boolean narrowing, then remove selectedService!.price_min! etc.      ↑
                                                                                                                                         ↑
c/components/features/calendar/CalendarClient.tsx:327
e ! is safe (block is guarded by selectedDetails.holiday &&); remove it by using optional chaining: onClick={() => handleDeleteHoliday(selectedDetails.holiday?.id ?? 0)} or restructuring so TypeScript sees the narrowing.

   Verify: npx tsc --noEmit after all Step 4 changes. Then npm run lint.

   ---
   Verification

 1. After Step 2: npx tsc --noEmit — expect no new errors from normalizeRelation replacements
 2. After Step 3: npx tsc --noEmit — all as never and as unknown as X casts removed or replaced
   3. After Step 4: npx tsc --noEmit + npm run lint — clean

   No behavior changes expected — all fixes are type-level or cosmetic. Walk each changed dashboard role to confirm no runtime regressions.