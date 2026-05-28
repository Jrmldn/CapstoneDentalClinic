# AppointDent 3-Week Implementation Plan


## Progress Summary
- [x] Supabase auth UI implemented for patient login
- [x] Patient dashboard page created and protected by role-based server auth
- [x] Superadmin login and admin dashboard skeleton implemented
- [x] Supabase browser + server clients configured
- [x] Root app page checks Supabase connectivity
- [ ] Database schema and RLS policies still pending
- [ ] Appointment engine, clinical chart, staff module, notifications, chatbot, and PDF export remaining

## Security (all weeks)
- [ ] Encryption: pgcrypto AES-256 on PII cols; bcrypt passwords via Supabase Auth
- [ ] RBAC: Patient/Staff/Dentist roles in JWT; enforced at API middleware + RLS
- [ ] No raw SQL: parameterized queries only; Zod schemas on all inputs
- [ ] Sessions: JWT 15-min expiry + refresh rotation; HttpOnly; SameSite=Strict
- [ ] Compliance: RA 10173 — consent stored as timestamped audit record

## Week 1 — Infrastructure, Auth, Patient Portal (Days 1–7)

**DB & RLS**
- [ ] Tables: users, clinics, appointments, dental_charts, prescriptions, inventory, notifications, logs, feedback
- [ ] RLS on every table; patients see own rows only; staff see own clinic only; dentist sees assigned patients
- [ ] PII cols encrypted at rest with pgcrypto

**Auth**
- [x] Supabase Auth; role claim in JWT; middleware guard on every route
- [ ] Login rate-limit: 5 attempts/15 min
- [ ] Email password reset; signed token; 1-hr expiry

**Patient Portal**
- [ ] Registration + Zod validation; consent audit record; one-time medical history form
- [ ] Map-based clinic discovery (geolocation API); filters: specialty, HMO, rating, status
- [ ] Patient reads/updates own profile only (RLS enforced)

Deliverables:
- [ ] DB migrations committed
- [x] auth passing for patient login and dashboard access
- [ ] RLS unit-tested
- [ ] patient portal on dev
- [ ] zero raw SQL confirmed

## Week 2 — Scheduling, Clinical Records, Staff Module (Days 8–14)

**Appointment Engine**
- [ ] Calendar: book/reschedule/cancel with conflict detection
- [ ] Status FSM: Pending→Confirmed→Completed/Cancelled/Rescheduled/No-Show
- [ ] Slot validation server-side only; client cannot override blocked dates
- [ ] Down payment via GCash/PayMaya; token never stored server-side
- [ ] QR walk-in flow; append-only audit log (RLS insert-only)

**Clinical Records (Dentist)**
- [ ] 2D dental chart: permanent + temporary teeth
- [ ] Records: restorations, prosthetics, oral surgery, periodontal, TMJ, prescriptions, treatment history
- [ ] Dentist role only writes clinical records (API middleware + RLS)
- [ ] Follow-up scheduler synced to all 3 calendar views
- [ ] PDF export: patient-viewable, read-only

**Staff Module**
- [ ] Clinic profile: services, HMO, hours, gallery; auto-close booking at daily limit
- [ ] Appointments: confirm/reschedule/status for registered, guest, walk-in
- [ ] Inventory with stock alert thresholds; billing (PhilHealth, senior/PWD, HMO)
- [ ] Sales analytics; PDF reports (revenue, appointment summary, service frequency)
- [ ] Staff cannot write dental charts (enforced at route level)

Deliverables:
- [ ] appointment FSM tested
- [ ] dental chart CRUD working
- [ ] staff dashboard live
- [ ] PDF export correct
- [ ] role violations return 403

## Week 3 — Notifications, Chatbot, Hardening, Testing (Days 15–21)

**Notifications**
- [ ] SMS + email (Twilio/SendGrid): confirmation, reschedule, day-before reminder, follow-up
- [ ] Contact data from registration only; no ad-hoc input
- [ ] Manual resend UI for staff; failed notifications logged with reason

**NLP Chatbot**
- [ ] Dialogflow: tokenization + intent matching
- [ ] Scope: services, hours, appointment procedures, general info
- [ ] Guest access (no login required)
- [ ] Inputs sanitized before Dialogflow call; no DB access path from chat

**Security Hardening**
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
| Maps | Geolocation API |
| Payments | GCash, PayMaya, Credit Card |
| Deploy | Vercel |

## Module Structure
```
modules/auth · patient · appointment · clinical · staff · notification · chatbot · log
middleware/authGuard(role) · validate(zod) · rateLimit
db/migrations · policies(RLS)
```
