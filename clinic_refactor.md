# Clinic Management UI/UX Refactor

## Context

The clinic management area (superadmin) needs a UX overhaul. 
The backend is working. Changes are primarily UI-focused, 
with minor backend additions for:
- Gallery file-upload support (new Supabase Storage actions)
- updateClinicProfile accepting name, latitude, longitude
- fetchClinics returning active/inactive totals for count summary
- Sort inactive clinics to the bottom server-side

Route note: clinic list lives at /superadmin-dashboard/clinic 
(singular), profile at /superadmin-dashboard/clinic/[id]/profile.

---

## Step 1 — Clinic List Page

### src/actions/clinicActions.ts
- Add .order('is_active', { ascending: false }) to fetchClinics
  (before created_at order) so active clinics come first
- Add parallel count queries to return activeCount and 
  inactiveCount (total, not filtered) alongside paginated query

### src/components/features/clinic/ClinicTable.tsx
- Remove columns: is_active (clickable badge), id (Profile 
  text link), latitude (Location), max_appointments_per_day 
  (Capacity), address
- Final columns: name, is_active (read-only badge — <div> 
  not <button>), email, phone
- Remove onEdit / selectableRows / deleteClinic / onDelete 
  usage from DataTable
- Add props: onDisable: (clinic: Clinic) => void and 
  onEnable: (clinic: Clinic) => void
- Add rowActions:
  - Pencil icon → router.push('/superadmin-dashboard/clinic/
    ${clinic.id}/profile') (import useRouter from next/navigation)
  - Ban icon (red) → onDisable(clinic), hidden: (c) => !c.is_active
  - UserCheck icon (green) → onEnable(clinic), 
    hidden: (c) => c.is_active

### src/app/superadmin-dashboard/clinic/page.tsx
- Add description after <ClinicHeader>:
  "Manage clinic branches and their operational status 
  across the system."
- Add count summary above table:
  "Showing X clinics (Y Active · Z Inactive)"
  using activeCount/inactiveCount from fetchClinics
- Remove handleEdit, isSaving, handleSaveClinic
  (keep Add-clinic path only — selectedClinic always null)
- Remove ClinicFormModal edit usage (keep for Add only)
- Add state: disableTarget: Clinic | null, 
  enableTarget: Clinic | null
- Wire ClinicTable onDisable={c => setDisableTarget(c)} 
  and onEnable={c => setEnableTarget(c)}
- Render <DisableClinicModal> and <EnableClinicModal> 
  at the bottom

---

## Step 2 — Create DisableClinicModal and EnableClinicModal

### src/components/features/clinic/DisableClinicModal.tsx (create)
- createPortal + mounted flag (SSR-safe)
- Props: clinic: Clinic | null, onClose: () => void, 
  onSuccess: () => void
- Confirmation input: "Type DELETE to confirm"
- Button disabled until input === 'DELETE'
- On confirm: call updateClinicStatus(clinic.id, false) 
  → onSuccess() → onClose()
- Red/destructive theming (ban is dangerous)

### src/components/features/clinic/EnableClinicModal.tsx (create)
- Same createPortal + mounted pattern
- Props: clinic: Clinic | null, onClose: () => void, 
  onSuccess: () => void
- Confirmation input: "Type ENABLE to confirm"
- Button disabled until input === 'ENABLE'
- On confirm: call updateClinicStatus(clinic.id, true) 
  → onSuccess() → onClose()
- Emerald theming (enabling is safe)

Both import updateClinicStatus from @/actions/clinicActions.

---

## Step 3 — Clinic Profile: General Info Tab

### src/actions/clinicSetupActions.ts
Expand updateClinicProfile data type:
```ts
data: {
  name?: string
  phone?: string
  email?: string
  address?: string
  latitude?: number | null
  longitude?: number | null
  manual_status?: string
  max_appointments_per_day?: number
  default_downpayment_amount?: number
}
```
No logic change — supabaseAdmin.from('clinics').update(data) 
already passes the object through.

### src/app/superadmin-dashboard/clinic/[id]/profile/_components/GeneralInfoForm.tsx
- Add name, latitude, longitude to form state
  (initialize from clinic prop)
- Remove readonly clinic name field and helper text
- Add editable name field (full-width, required)
- Add latitude and longitude number fields 
  (side-by-side, optional, step="any")
- Include name, latitude, longitude in updateClinicProfile call
- Reorganize layout into two sections:

  Section 1 "General Information":
  - Clinic Name (full-width)
  - Phone + Email (2-col)
  - Address (full-width)
  - Latitude + Longitude (2-col)

  Section 2 "Appointment Settings":
  - Clinic Status dropdown
  - Daily Capacity + Booking Downpayment (2-col)

---

## Step 4 — Clinic Profile: Remove Dentist Schedules Tab

### src/app/superadmin-dashboard/clinic/[id]/profile/page.tsx
- Change subtitle to:
  "Manage general information, operating hours, specialties, 
  gallery, and holidays."
- Remove parallel queries: dentistsRes, blockedSlotsRes, 
  workingHoursRes
- Remove grouping loops and blockedSlotsMap/workingHoursMap
- Stop passing dentists, blockedSlotsMap, workingHoursMap 
  to <ProfileTabs>

### src/app/superadmin-dashboard/clinic/[id]/profile/_components/ProfileTabs.tsx
- Remove dentist-schedules entry from TABS array
- Remove Users lucide import
- Remove DentistScheduleTab import
- Remove dentists, blockedSlotsMap, workingHoursMap 
  from Props interface
- Remove active === 'dentist-schedules' render block

---

## Step 5 — Gallery: Replace URL Paste with File Upload

### src/actions/clinicSetupActions.ts — new actions

```ts
// Upload one image file; returns the new gallery record
export async function uploadClinicGalleryImage(
  clinicId: number, 
  formData: FormData
)

// Delete one image by DB row id (also removes from Storage)
export async function deleteClinicGalleryImage(
  imageId: number, 
  imagePath: string
)

// Update sort_order for all images (after reordering)
export async function reorderClinicGalleryImages(
  rows: { id: number; sort_order: number }[]
)
```

**uploadClinicGalleryImage:**
- ensureRole('superadmin')
- Extract File from formData.get('file')
- Path: `${clinicId}/${Date.now()}-${file.name}`
- Upload to supabaseAdmin.storage.from('clinic-gallery')
- Get publicUrl via getPublicUrl(path)
- Get current max sort_order for clinic
- Insert { clinic_id, image_url: publicUrl, sort_order: nextOrder }
- revalidatePath the profile page
- Return the new row

**deleteClinicGalleryImage:**
- ensureRole('superadmin')
- Delete row from clinic_gallery by id
- Extract path from imagePath (after /clinic-gallery/)
- supabaseAdmin.storage.from('clinic-gallery').remove([path])
- revalidatePath the profile page

**reorderClinicGalleryImages:**
- ensureRole('superadmin')
- Promise.all of update({ sort_order }) for each row
- revalidatePath

### src/app/superadmin-dashboard/clinic/[id]/profile/_components/GalleryForm.tsx

**State:**
```ts
interface GalleryItem {
  id: number
  url: string
  filename: string  // basename from URL
  sort_order: number
}
```
Initialize from gallery prop 
(extract filename from URL via split('/').pop())

**Upload area (replaces URL input):**
- Hidden `<input type="file">` with ref
- Styled drop zone with onDragOver / onDrop handlers
- onClick triggers fileInputRef.current.click()
- Client-side validation: file.size > 5MB → show error
- uploading boolean state → show progress bar
- On file selected: build FormData → call 
  uploadClinicGalleryImage → update state with returned row

**Image list:**
- Show item.filename instead of full URL
- Delete button calls deleteClinicGalleryImage immediately
- No bulk save needed for delete

**Save Order button (replaces "Save Gallery"):**
- Calls reorderClinicGalleryImages on click
- Only needed after reordering

---

## Step 6 — Personnel: Dentist Schedule Link

### src/components/features/personnel/UnifiedPersonnelTable.tsx
- Import CalendarDays from lucide-react
- Import useRouter from next/navigation
- Add rowAction before disable/enable:
```ts
{
  icon: CalendarDays,
  label: 'View Schedule',
  onClick: (p) => router.push(
    `/superadmin-dashboard/personnel/dentist/${p.userId}/schedule`
  ),
  className: 'text-blue-500 hover:text-blue-700',
  hidden: (p) => p.role !== 'dentist',
}
```

### src/app/superadmin-dashboard/personnel/dentist/[userId]/schedule/page.tsx (create)
1. enforceRole('superadmin')
2. Await params → userId: string
3. Fetch dentist by user_id from dentists table
4. If not found → redirect('/superadmin-dashboard/personnel')
5. Fetch blocked slots from dentist_blocked_slots
6. Fetch working hours from dentist_availability 
   ordered by day_of_week
7. Build blockedSlotsMap and workingHoursMap
8. Render:
   - ← Back to Personnel link
   - Title: "Dentist Schedule: {firstName} {lastName}"
   - Subtitle: "Manage working hours and blocked dates 
     for this dentist."
   - <DentistScheduleTab> with dentists, blockedSlotsMap, 
     workingHoursMap props

Import DentistScheduleTab from its existing path.

---

## Step 7 — Documentation

Create docs/plans/clinic-ui-refactor.md as the last step.

Include:
- Summary of all changes
- Files created / edited / orphaned
- New server actions added
- Supabase Storage bucket setup instructions
- Any decisions made during implementation
- Verification checklist

---

## Files Summary

### Create
- src/components/features/clinic/DisableClinicModal.tsx
- src/components/features/clinic/EnableClinicModal.tsx
- src/app/superadmin-dashboard/personnel/dentist/[userId]/schedule/page.tsx
- docs/plans/clinic-ui-refactor.md

### Edit
- src/actions/clinicActions.ts
- src/actions/clinicSetupActions.ts
- src/app/superadmin-dashboard/clinic/page.tsx
- src/components/features/clinic/ClinicTable.tsx
- src/app/superadmin-dashboard/clinic/[id]/profile/page.tsx
- src/app/superadmin-dashboard/clinic/[id]/profile/_components/ProfileTabs.tsx
- src/app/superadmin-dashboard/clinic/[id]/profile/_components/GeneralInfoForm.tsx
- src/app/superadmin-dashboard/clinic/[id]/profile/_components/GalleryForm.tsx
- src/components/features/personnel/UnifiedPersonnelTable.tsx

### Orphaned (do not delete)
- EditClinicModal.tsx (if it exists in repo)

---

## Supabase Storage Prerequisite

Create clinic-gallery bucket manually before running:
Supabase Dashboard → Storage → New Bucket
- Name: clinic-gallery  
- Toggle Public: ON

---

## Verification Checklist

- [ ] Clinic list shows Name/Status/Email/Phone only — 
      no checkbox, no location, no capacity
- [ ] Inactive clinics sorted to bottom
- [ ] Count summary shows correct Active/Inactive counts
- [ ] Ban icon → DisableClinicModal (type DELETE) → 
      status changes to Inactive
- [ ] UserCheck icon → EnableClinicModal (type ENABLE) → 
      status changes to Active
- [ ] Pencil icon → navigates to clinic profile page
- [ ] General Info: Clinic Name is editable, lat/lng 
      fields present, Save Changes works
- [ ] Only 5 tabs in Clinic Profile (no Dentist Schedules)
- [ ] Gallery: file upload works, filename shown, 
      delete removes from storage + DB, reorder persists
- [ ] Personnel: Calendar icon on dentist rows only → 
      navigates to dentist schedule page
- [ ] Dentist schedule page loads with working hours 
      and blocked slots
- [ ] npm run lint — 0 errors