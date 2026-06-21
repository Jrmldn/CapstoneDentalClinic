## Blocked on dialog decision (still deferred):
- AppointmentsClient.tsx — 3× confirm(), 2× alert(), no submit-disable on action buttons
- PatientRecordModal.tsx — 4× alert() calls (structural split is done; only the dialog lines remain)
- DataTable — confirm() calls
These unblock the moment you pick a replacement mechanism. The CLAUDE.md TODO on line 70 captures this: toast library vs. shared <ConfirmDialog>.
Options from here:
1. Decide the dialog mechanism — pick toast (e.g. sonner/react-hot-toast) for success/error messages + a shared <ConfirmDialog> for destructive confirmations, then finish the two 🔴 files
2. Start something new — new feature, bug fix, or a different part of the codebase
3. Commit the refactor work — wrap up the 5 completed steps into the planned commit grouping before moving on
