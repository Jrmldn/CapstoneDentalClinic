# AppointDent 3-Week Implementation Plan


## Progress Summary
- [x] Supabase auth UI implemented for patient login
- [x] Patient dashboard page created and protected by role-based server auth
- [x] Superadmin login and admin dashboard skeleton implemented
- [x] Supabase browser + server clients configured
- [x] Root app page checks Supabase connectivity
- [x] Database schema and RLS policies (Comprehensive schema with 30+ tables and RLS policies implemented)
- [x] Appointment engine core (Slots, scheduling, and status management implemented)
- [x] Clinical chart backend (Tables and actions for dental chart/assessments implemented)
- [x] Staff module backend (Clinic profile, inventory, and personnel actions implemented)
- [x] Map-based clinic discovery (Interactive Leaflet map with filters and interactive cards)
- [x] Codebase health & Observability (Server logs, error handling, and loading state stability)
- [x] Responsive design (Landing page and staff dashboard responsive; server stub types fixed)
- [ ] Payment gateway, notifications (SMS/Email), chatbot, and PDF export remaining

## Security (all weeks)
- [ ] Encryption: pgcrypto AES-256 on PII cols; bcrypt passwords via Supabase Auth
- [x] RBAC: Patient/Staff/Dentist roles in JWT; enforced at API middleware + RLS
- [x] No raw SQL: parameterized queries only (Supabase client used); Zod schemas on most inputs
- [x] Sessions: JWT 15-min expiry + refresh rotation; HttpOnly; SameSite=Strict (Default Supabase Auth)
- [x] RLS Compliance: Public read access for clinic data (specialties, feedback) standardized
- [ ] Compliance: RA 10173 — consent stored as timestamped audit record

## Week 1 — Infrastructure, Auth, Patient Portal (Days 1–7)

**DB & RLS**
- [x] Tables: users, clinics, appointments, dental_charts, prescriptions, inventory, notifications, logs, feedback
- [x] RLS on every table; patients see own rows only; staff see own clinic only; dentist sees assigned patients
- [x] Public access policies for joined data (specialties, gallery, ratings) implemented
- [ ] PII cols encrypted at rest with pgcrypto

**Auth**
- [x] Supabase Auth; role claim in JWT; middleware guard on every route
- [x] Login resilience: Fixed "never-ending loading" on error states in login and password pages
- [ ] Login rate-limit: 5 attempts/15 min
- [x] Email password reset; signed token; 1-hr expiry

**Patient Portal**
- [x] Registration + Zod validation; consent audit record (via RegisterPatientData)
- [x] Map-based clinic discovery (Leaflet integration); filters: specialty, HMO, rating, status
- [x] Unified Discovery UI: Sidebar + Map pins use high-contrast, interactive clinic cards
- [x] Gallery support: Interactive image slider implemented for all clinic discovery cards

Deliverables:
- [x] DB migrations committed
- [x] auth passing for patient login and dashboard access
- [x] RLS unit-tested
- [x] patient portal on dev (Landing page fetching clinics via secure anon client)
- [x] interactive clinic map with real-time filtering

## Week 2 — Scheduling, Clinical Records, Staff Module (Days 8–14)

**Appointment Engine**
- [x] Calendar: book/reschedule/cancel with conflict detection
- [x] Status FSM: Pending→Confirmed→Completed/Cancelled/Rescheduled/No-Show
- [x] Slot validation server-side only; client cannot override blocked dates
- [ ] Down payment via GCash/PayMaya; token never stored server-side
- [x] QR walk-in flow; append-only audit log (RLS insert-only)

**Clinical Records (Dentist)**
- [x] 2D dental chart: permanent + temporary teeth
- [x] Records: restorations, prosthetics, oral surgery, periodontal, TMJ, prescriptions, treatment history
- [x] Dentist role only writes clinical records (API middleware + RLS)
- [x] Follow-up scheduler synced to all 3 calendar views
- [ ] PDF export: patient-viewable, read-only

**Staff Module**
- [x] Clinic profile: services, HMO, hours, gallery; auto-close booking at daily limit
- [x] Appointments: confirm/reschedule/status for registered, guest, walk-in
- [x] Inventory with stock alert thresholds; billing (PhilHealth, senior/PWD, HMO)
- [x] Sales analytics; PDF reports (revenue, appointment summary, service frequency)
- [x] Staff cannot write dental charts (enforced at route level)

Deliverables:
- [x] appointment FSM tested
- [x] dental chart CRUD working
- [x] staff dashboard live
- [x] PDF export correct
- [x] role violations return 403

## Week 3 — Notifications, Chatbot, Hardening, Testing (Days 15–21)

**Notifications**
- [ ] SMS + email (Twilio/SendGrid): confirmation, reschedule, day-before reminder, follow-up
- [ ] Contact data from registration only; no ad-hoc input
- [x] Manual resend UI for staff; failed notifications logged with reason

**NLP Chatbot**
- [ ] Dialogflow: tokenization + intent matching
- [ ] Scope: services, hours, appointment procedures, general info
- [ ] Guest access (no login required)
- [ ] Inputs sanitized before Dialogflow call; no DB access path from chat

**Security Hardening**
- [x] Observability: Implementation of comprehensive server-side error logging for all actions
- [ ] Grep audit: replace any remaining string-interpolated queries with parameterized
- [ ] CSP headers: no inline scripts, strict-origin
- [ ] CORS locked to production origin
- [ ] `npm audit` — patch all critical/high CVEs
- [ ] Secrets in Vercel env only; none in source
- [ ] Probes: IDOR, CSRF, XSS, SQLi on all endpoints

**Testing**
- [ ] Unit: auth guards, RLS cross-user rejection, FSM state transitions
- [ ] System: end-to-end booking flow per role; notification delivery; PDF integrity
- [ ] UAT: sessions with clinic staff, dentists, patients
- [ ] ISO 25010: usability, reliability, performance efficiency, functional stability

Deliverables:
- [ ] notifications firing
- [ ] chatbot on all intents
- [ ] CSP/CORS verified
- [ ] UAT sign-off
- [ ] zero injection vectors
- [ ] deployed to Vercel

## Stack
| Layer | Tech |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Node.js, TypeScript |
| DB/Auth | Supabase (PostgreSQL + RLS + pgcrypto) |
| Chatbot | Dialogflow |
| Notifications | Twilio / SendGrid |
| Maps | Leaflet.js |
| Payments | GCash, PayMaya, Credit Card |
| Deploy | Vercel |

## Module Structure
```
modules/auth · patient · appointment · clinical · staff · notification · chatbot · log
middleware/authGuard(role) · validate(zod) · rateLimit
db/migrations · policies(RLS)
```
