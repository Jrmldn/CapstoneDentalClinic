# AppointDent — Dental Clinic Management System

AppointDent is a modern, clean, and highly modular dental clinic management platform built using Next.js (App Router), TypeScript, and Supabase. The project has undergone a complete architectural refactoring to strictly enforce the separation of concerns, modular design, and robust typing.

---

## 🏗️ Clean Architecture System

Our codebase isolates data access, presentation, orchestration, and business logic into dedicated, self-documenting layers:

```
src/
├── app/                  # Route shells (Routing, Authentication, & Layout wrapper entries)
├── actions/              # Server Actions (Slim orchestrators, validations, cache revalidation)
├── services/             # Data Access Layer (Direct Supabase mutations & queries only)
├── utils/                # Pure business logic, helpers, formatting, and mathematical models
├── components/
│   ├── common/           # Shared generic UI components (e.g., DataTable, SearchAndFilterBar)
│   └── features/         # Page components organized by business domains (UI, local state, forms)
│       ├── clinic/             # Clinic configuration and lists
│       ├── clinic-services/    # Treatments, dental services, and product options
│       ├── dashboard/          # Staff and Superadmin overview widgets & charts
│       ├── inventory/          # Medical supply tracking, thresholds, and usage logs
│       ├── landing-page/       # Public-facing informative layout, maps, and filters
│       └── personnel/          # Dentists and clinic staff user management
└── types/                # Centralized, decoupled type definitions
```

---

## 🧩 Architectural Layers & Design Principles

### 1. Route Shells (`src/app/`)
Router pages act as lightweight entry points. They do not handle inline API requests or raw state layouts. Server pages resolve authentication, fetch data through the services layer, and immediately delegate to a dedicated presentational feature entry (e.g., `<StaffDashboardView />`).

### 2. Server Actions Orchestrators (`src/actions/`)
Actions act as thin orchestrators. They handle request validation, encapsulate try/catch blocks, output logs, invoke backend service operations, and perform cache revalidations via `revalidatePath`.

### 3. Backend Services Layer (`src/services/`)
Located under `src/services/`, these files isolate direct Supabase queries (`supabaseAdmin.from(...)`). Service methods are strictly typed, returning standard Supabase Promises to allow orchestrating actions to catch errors.

### 4. Pure Utilities & Math (`src/utils/`)
Any raw formatting, offset calculations, statistics aggregation, or float-quantity mathematics are isolated into helper libraries (e.g., `calculateStaffDashboardStats`, `formatInventoryLogs`). These functions are completely side-effect free.

### 5. Domain Types (`src/types/`)
Wildcard exports have been eliminated. Type interfaces are split by explicit feature domains, such as `src/types/clinic.ts` and `src/types/dashboard.ts`, preventing path-alias circular imports.

---

## 🛠️ Refactoring Roadmap & Success Logs

The codebase has completed all 4 key architectural refactoring phases:

1. **✅ Phase 1: Data Engine Isolation**
   - Extracted direct queries out of server actions into dedicated services (`appointmentService`, `billingService`, `inventoryService`, `personnelService`).
2. **✅ Phase 2: Feature Domain Consolidation**
   - Moved all page components (modals, tables, local hooks) out of routing folders and consolidated them under `@/components/features/`.
3. **✅ Phase 3: Route Shell Extraction**
   - Stripped heavy calculations and direct client-side state fetching out of routing pages, transforming router shells into lightweight wrappers.
4. **✅ Phase 4: Core Standardization & Paths**
   - Decoupled shared type files, resolved lingering relative backtracking paths (`../../`) to absolute aliases (`@/...`), solved all ESLint errors, and cleared out unused variables.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and configure your Supabase access details:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

### 4. Quality & Compiler Audits
Before committing any changes, ensure all tests, types, and styles are validated:
```bash
# Verify ESLint Rules
npm run lint

# Check TypeScript Compiler
npx tsc --noEmit
```
