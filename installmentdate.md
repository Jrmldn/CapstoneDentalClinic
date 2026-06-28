Remove the due-date concept entirely from the installment plan flow (staff setup screen and patient plan view), per a product decision: installments are now balance-based, not schedule-based — patients can pay in any order/pace as long as the total balance is eventually settled. The superadmin's installment template config (downpayment amount + number of installments, on the services table) already has no dates and doesn't need changes.
1. "Set Up Installment Plan" screen (staff-facing, used when assigning a plan to a patient):

Remove the "First Due Date (downpayment)" date picker entirely.
Remove the generated "Payment Schedule" list with calculated calendar dates (Jun 26, 2026, Jul 26, 2026, etc.) — replace with a simple list of installments showing just installment number and amount (e.g. "1. Downpayment — ₱10,000", "2. ₱10,000", etc.), no dates.
Keep Service, Downpayment, Installments count, Monthly amount, Total, and Notes (optional) as-is.

2. Patient "Installment Plan" view:

Remove "Due date: [date]" from each installment line.
Keep Installment #, Amount, Paid/Pending status badge, "Paid on [date]" (this is fine to keep — it reflects an actual payment event, not a scheduled due date), and "Mark as Paid" action for pending ones.

3. Database/schema:

Check Supabase schema for the table storing per-patient installment plan instances (likely something like patient_installment_plans or installments) — identify and remove due-date columns (e.g. due_date) via migration, keeping paid_at/paid_on since that's a real event timestamp, not a schedule.
Update any Server Actions/queries currently generating or relying on the calculated due-date schedule (e.g. the monthly date-increment logic from the First Due Date) to stop generating dates entirely.
Regenerate supabase-types.ts after the migration.

4. Confirm no other screen (billing tab, invoice, reminders) still expects or displays a due date for installments — update accordingly if found.
Verify with npx tsc --noEmit and npm run lint, and visually confirm both the staff setup screen and patient plan view no longer show or require due dates, while paid/pending status and "Mark as Paid" still work correctly.