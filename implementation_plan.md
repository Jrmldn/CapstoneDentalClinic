# Interactive Clinic Map — Landing Page

Add an interactive Leaflet.js + OpenStreetMap map section to the landing page that displays all active clinic locations as clickable markers, with a sidebar clinic list that syncs with the map.

---

## Overview

The map section will sit between the **Hero** and the existing "Our Partner Clinics" grid. It will:

- Render a real Leaflet map centered on Metro Manila (or auto-fit to the clinics' bounds).
- Place a custom dental-themed marker for every active clinic that has `latitude` and `longitude` stored in the database.
- Show a popup on each marker with clinic name, address, and a **"View & Book"** button.
- Include a scrollable sidebar list of all clinics; clicking a list item flies the map to that clinic and opens its popup.
- Highlight/sync the active list item as the user interacts with markers.

---

## Open Questions

> [!IMPORTANT]
> **Q1 – Clinics without coordinates**: Some clinic rows may have `latitude: null` and `longitude: null` (added by superadmin without a pin). Should those clinics:
> - **A)** Still appear in the sidebar list but be omitted from the map, OR
> - **B)** Be hidden entirely from both list and map until coordinates are added?

> [!IMPORTANT]
> **Q2 – Default map center**: If no clinic has coordinates, should the map default to a hard-coded Metro Manila center `[14.5995, 120.9842]`, or should the map section be hidden entirely?

> [!NOTE]
> **Q3 – Section placement**: Plan puts the map ABOVE the existing "Our Partner Clinics" card grid. Should it **replace** the card grid entirely, or keep both (map + card grid below)?

---

## Proposed Changes

### 1. Install `leaflet` + typings

```
npm install leaflet
npm install -D @types/leaflet
```

Leaflet is a pure-client-side library — it must only be rendered inside a `'use client'` component with **dynamic import** (`ssr: false`) to avoid SSR issues in Next.js.

---

### 2. Data Layer — extend `page.tsx` query

#### [MODIFY] [page.tsx](file:///c:/Users/Reymond%20E.%20Billones/capstone-dental-clinic/src/app/page.tsx)

- Extend the Supabase select to also fetch `latitude`, `longitude`, `email`, and `is_active`.  
- Pass the full clinic array as a prop to the new `<ClinicMap>` component.

---

### 3. New Components

#### [NEW] `src/components/features/landing-page/ClinicMap.tsx` — **Client Component**

This is the core component. It uses `dynamic` import to load Leaflet only on the client:

```
'use client'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('./LeafletMapInner'), { ssr: false })
```

It receives `clinics: Clinic[]` as props and renders:
- **Left panel**: scrollable clinic list (name, address, open/close badge, phone)
- **Right panel**: `<LeafletMapInner>` with the actual Leaflet map

On list-item click → fly map to marker + open popup.  
On marker click → highlight matching list item.

#### [NEW] `src/components/features/landing-page/LeafletMapInner.tsx` — **Pure Leaflet logic**

Responsible for:
- Initializing the `L.map()` instance in a `useEffect`
- Importing Leaflet CSS via `import 'leaflet/dist/leaflet.css'`
- Fixing the Leaflet default icon path (known Next.js gotcha — must override `L.Icon.Default.prototype._getIconUrl`)
- Creating a custom `DivIcon` dental marker (SVG tooth emoji or FontAwesome via inline SVG)
- Adding `L.tileLayer` with OpenStreetMap tiles
- Placing markers for every clinic with `lat`/`lng`
- Exposing a `ref` callback so `ClinicMap` can call `map.flyTo()` imperatively

#### [MODIFY] `src/app/globals.css`

Add one rule to ensure Leaflet tiles render correctly in the Next.js environment:

```css
/* Leaflet fix */
.leaflet-container {
  height: 100%;
  width: 100%;
  z-index: 0;
}
```

---

### 4. Wire into Landing Page

#### [MODIFY] [page.tsx](file:///c:/Users/Reymond%20E.%20Billones/capstone-dental-clinic/src/app/page.tsx)

Add the `<ClinicMap>` section between Hero and Features:

```tsx
import { ClinicMap } from "@/components/features/landing-page/ClinicMap"

// Inside return:
<section id="clinic-map" className="py-16 bg-white">
  <ClinicMap clinics={clinicsList} />
</section>
```

---

## Visual Design

| Element | Design decision |
|---|---|
| Section heading | `"Find a Clinic Near You"` with subtitle |
| Map height | `480px` (desktop), `320px` (mobile stacked below list) |
| Marker | Custom blue SVG circle with a tooth icon |
| Popup | White card: name (bold), address, phone, blue "Book Now" link |
| Sidebar | Scrollable `max-h-[480px]`, hover highlight `bg-blue-50`, active border `border-l-4 border-blue-500` |
| Layout | `grid lg:grid-cols-[320px_1fr]` — list left, map right |

---

## Verification Plan

### Automated
- `npm run build` — must compile without errors (Leaflet SSR exclusion must be correct)

### Manual
1. Landing page loads — map section renders with OpenStreetMap tiles
2. Clinic markers appear at correct coordinates
3. Clicking a marker → popup with correct clinic info
4. Clicking a sidebar clinic → map flies to marker, popup opens
5. Mobile view → list stacks above map, both still functional
6. Clinics without lat/lng → appear in sidebar only (or hidden, per Q1 answer)
