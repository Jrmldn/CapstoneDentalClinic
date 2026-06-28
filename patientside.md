Implement a responsive mobile view for the patient portal in AppointDent. Scan the existing patient portal layout and pages first (sidebar, dashboard, calendar, appointments) before making changes, and give me a short inventory of what you find and what needs to change — no edits yet.

Requirements:

1. **Sidebar (mobile only, e.g. below `md` breakpoint)**
   - Sidebar is hidden by default on mobile and collapses to a hamburger icon in the top bar.
   - Tapping the hamburger opens the sidebar as an overlay drawer that slides in over the page content (not a push/squeeze layout).
   - Drawer closes on: tapping a backdrop overlay, tapping a close (X) button, navigating to a new page, and pressing Escape.
   - Preserve all existing sidebar sections/links and the active-route highlighting exactly as on desktop.
   - Desktop layout (sidebar always visible, no drawer) must be unaffected.

2. **My Calendar (mobile only)**
   - The "Day Details" panel must not render anywhere in the mobile layout by default — not below the calendar, not collapsed, not empty. On page load, mobile shows only the legend and the calendar grid.
   - Tapping a calendar date that has appointments opens a modal (bottom sheet or centered, your call based on what's idiomatic in our component library) showing that day's appointment list — same data/fields as the desktop Day Details panel (date header, appointment count, each appointment's title, time, dentist, and status badge).
   - Tapping a date with zero appointments does nothing (no empty modal, no empty panel).
   - Modal closes via backdrop tap, close button, and Escape, and returns to the calendar-only view (Day Details content does not persist on screen after closing).
   - Desktop view keeps the existing inline Day Details panel exactly as is, always visible beside the calendar — this change is mobile-only.

3. **My Appointments — past appointments (mobile and desktop)**
   - Limit the past appointments list to 5 per page.
   - Add prev/next pagination controls with a "Showing X–Y of Z" or page indicator.
   - Prefer server-side pagination (Supabase `.range()`) over client-side slicing if the data is fetched from a server component/action; if it's already client-fetched in full, client-side pagination is fine for now — note which approach you used and why.

Constraints:
- Match existing design tokens, spacing, and component patterns already used in the codebase — don't introduce new colors/styles ad hoc.
- Don't touch the single-clinic dental app project; this is AppointDent (multi-tenant) only.
- Run `npx tsc --noEmit` and `npm run lint` after changes, per CLAUDE.md.
- Keep edits in small, reviewable batches — give me the file list and a summary before applying changes, then implement.