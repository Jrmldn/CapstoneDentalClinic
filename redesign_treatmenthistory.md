# Task: Redesign Treatment History Session Card UI

## Context
The grouped Treatment History session card (EHR Viewer → Treatment tab) currently looks cluttered/confusing. Current layout:
- Blue numbered badge ("2") on the left — looks like a step indicator or unread count, not a procedure count
- Bold headline: "Session · 2 procedures"
- Subtitle: date (e.g. "Jun 28, 2026")
- Expanded: plain rows for each service (e.g. "Bridge" with tooth badge, "Teeth Cleaning")
- Footer: "Attending: Dr. Quack Quack · Clinic Branch · Jun 28, 2026, 7:56 PM" (date repeated from subtitle)
- Bare session ID in the corner ("S-009")

## Changes

1. **Replace the numbered badge with a neutral icon**
   Swap the blue "2" circle/badge for a calendar or clipboard icon — don't use a number, since the procedure count is already stated in text. The icon should just visually anchor the card, not convey a count.

2. **Flip the header hierarchy — date becomes the primary bold line**
   - Bold headline: the date (e.g. "Jun 28, 2026")
   - Subtitle (smaller, muted): "2 procedures · Dr. Quack Quack" (combine procedure count + dentist name here instead of in the footer)
   - Remove "Session ·" prefix entirely — redundant once this is clearly a session-level card.

3. **Remove the duplicate date from the footer**
   Footer should now only show: "Clinic Branch · Jun 28, 2026, 7:56 PM" (precise timestamp, no need to repeat date since it's now the headline). Drop "Attending: Dr. Quack Quack" from the footer since it moved to the subtitle in step 2 — don't show dentist name twice.

4. **Add clinical notes to each nested service row, if available**
   Each expanded service row (e.g. "Bridge," "Teeth Cleaning") should show its clinical notes (if present) inline, not just the bare service name + tooth badge. Do **not** show price/fee here — this is a clinical record view, not a billing view; pricing stays on the invoice only. e.g.:
   ```
   Bridge                                    Tooth #81
   [clinical notes here, if any]
   ```

5. **Label the session ID clearly**
   Change the bare corner code (e.g. "S-009") to something self-explanatory, e.g. "Session #009" or "Visit #009" — small/muted styling is fine, just make it legible as an ID rather than a cryptic fragment.

## Notes
- This is a visual/layout change only — no changes to the underlying grouping logic, data fetching, or session/appointment_id relationships from the prior fix.
- Keep the expand/collapse accordion behavior as-is.
- Apply consistently to all session cards, including legacy/standalone (non-grouped) entries if they share the same card component — adjust singular/plural text appropriately (e.g. "1 procedure" vs "2 procedures").

## Acceptance Criteria
- [ ] No numbered badge — replaced with a neutral icon
- [ ] Date is the bold primary headline; procedure count + dentist name in subtitle
- [ ] No duplicated date or dentist name between header and footer
- [ ] Each nested service row shows notes (if present), not just the name — no price/fee shown
- [ ] Session ID is clearly labeled, not a bare code
- [ ] Singular/plural handled correctly for procedure count (1 vs 2+)
- [ ] No regressions to expand/collapse behavior or grouping logic