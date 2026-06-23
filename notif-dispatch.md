# Prompt: Move Notification Dispatcher Logs to Superadmin-Only

in plan mode

---

## Context

The "Notification Dispatcher Logs" page (currently under Staff Portal →
Notifications) monitors SMS & Email dispatch status, shows failure reasons,
and lets the user manually retrigger failed notifications.

After review, this is an operational/technical concern (delivery
infrastructure health), not something branch staff need day-to-day. Decision:
**make this superadmin-only.** Staff should not have this page at all —
remove it from the staff sidebar/nav entirely, don't just hide it behind a
permission check while leaving it visible.

The superadmin version should show the **same dispatch-log data**, but
**across all branches**, not scoped to one clinic — since superadmin already
has cross-branch visibility elsewhere in the app (per the existing
`auth_clinic_id()` / `auth_role()` pattern).

## Task

### Step 1 — Discovery
- Find the current staff-side "Notification Dispatcher Logs" page (route,
  component, and whatever data-fetching/service layer it uses)
- Confirm whether this page is staff-only today, or also already reachable
  by superadmin somewhere
- Confirm how the underlying dispatch-log data is scoped today — is it
  already filtered by `clinic_id`, or is it global and the staff page just
  happens to only show one branch's worth because of how the query/RLS works?

### Step 2 — Plan the move
- Remove the Notifications nav item and page from the staff portal entirely
- Add an equivalent page under the superadmin portal (reuse the existing
  component/table structure where possible — this is a relocation +
  scope-widening, not a rebuild)
- The superadmin version should not have a single implicit branch — it
  should show dispatch logs across all branches, with a branch filter if
  useful (mirroring how other superadmin pages handle the "All Branches" vs
  one-branch view, if that pattern already exists elsewhere in the app)
- Confirm the "manually retrigger failed notifications" action still works
  correctly when scoped to all branches (i.e. retriggering one row only
  affects that row's branch/patient, not some global side effect)

### Step 3 — Verify no other references break
- Check if anything else links to or depends on the staff-side notifications
  route (e.g. a notification bell/badge elsewhere in the staff UI that links
  there) — update or remove those references consistently

## Out of Scope
- No change to how dispatch logs are actually generated or how
  retry/retrigger logic works internally — this is purely about relocating
  the page and widening its scope to all branches, not changing the
  underlying notification-sending mechanism.

## Verification
- Staff portal: "Notifications" nav item is gone; the old route either
  redirects appropriately or 404s (confirm which behavior makes sense given
  how routing/`enforceRole` works elsewhere)
- Superadmin portal: new "Notification Dispatcher Logs" page exists, shows
  dispatch logs from multiple branches (not just one), filters/search still
  work
- Retriggering a failed notification from the superadmin view works
  correctly for a patient at a specific branch
- `npm run lint` clean

---