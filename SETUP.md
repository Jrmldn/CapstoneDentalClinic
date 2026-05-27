# Multi-Tenant Dental Clinic Management System - Setup Guide

## Overview

This guide covers the setup and configuration of the foundational authentication, database triggers, and routing for your multi-tenant AppointDent platform.

## Prerequisites

- Node.js 18+ and npm
- Supabase project
- PostgreSQL database (via Supabase)
- Environment variables configured

## Step 1: Database Setup

### Execute the PostgreSQL Trigger

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Create a new query and copy the contents of `database/triggers.sql`
4. Execute the query

This will create:
- `public.handle_new_user()` function that fires on new auth user registration
- Automatically creates entries in `public.users` table (default role: 'patient')
- Automatically creates entries in `public.patients` table
- Parses `full_name` from OAuth metadata into `first_name` and `last_name`

## Step 2: Environment Variables

Ensure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 3: Project Structure

The authentication system creates these key routes:

```
src/app/
├── login/                          # Patient Portal Login
│   └── page.tsx                    # Uses Supabase Auth UI with Google OAuth
├── admin-login/                    # Superadmin Login
│   └── page.tsx                    # Custom form (Email/Password)
├── auth/
│   └── callback/
│       └── route.ts                # OAuth callback handler
├── patient-dashboard/              # Protected patient portal
│   └── page.tsx                    # Patient home page
└── superadmin-portal/              # Protected admin dashboard
    └── page.tsx                    # Admin control panel

middleware.ts                        # Route protection & authorization
```

## Step 4: Route Protection

### Patient Dashboard (`/patient-dashboard`)
- Not explicitly protected in middleware; relies on client-side redirect on login
- Fetches patient data from database
- Redirect to `/login` if unauthorized

### Superadmin Portal (`/superadmin-portal`)
- **Protected by middleware.ts**
- Checks if user is authenticated
- Verifies user role is `'superadmin'` in the `users` table
- Redirects to `/admin-login` if not authorized

### Login Routes
- `/login` - Public patient login (uses Auth UI)
- `/admin-login` - Public admin login (custom form)

## Step 5: User Roles

Your system supports 4 roles:

1. **`superadmin`** - Can access `/superadmin-portal`
2. **`staff`** - Staff member (dentist office staff)
3. **`dentist`** - Dental professional
4. **`patient`** - Default role for new registrations

To create a superadmin:

```sql
-- Update a user's role to superadmin (via Supabase SQL)
UPDATE public.users SET role = 'superadmin' WHERE id = 'user_id_here';
```

## Step 6: Testing the Flow

### Patient Registration & Login
1. Navigate to `http://localhost:3000/login`
2. Click "Sign up" or login with Google
3. After successful auth, middleware redirects to `/patient-dashboard`
4. Trigger automatically creates patient profile

### Superadmin Login
1. Navigate to `http://localhost:3000/admin-login`
2. Enter superadmin email and password
3. After successful auth, system verifies role
4. If role is `superadmin`, redirects to `/superadmin-portal`
5. If not superadmin, signs out and shows "Access Denied"

## Key Features

### 1. Automated Profile Creation
- When users register via OAuth, the trigger automatically creates:
  - Entry in `public.users` table with role `'patient'`
  - Entry in `public.patients` table with parsed name fields
  - Default phone: `'Update required'`

### 2. Multi-Tenant Architecture
- Each clinic can have multiple staff/dentists
- Patients belong to specific clinics
- Superadmin has platform-wide access

### 3. Security
- Server-side middleware validates superadmin access
- Password hashing managed by Supabase Auth
- Role-based access control (RBAC) at database level
- SSR cookie handling for session persistence

## File Reference

| File | Purpose |
|------|---------|
| `database/triggers.sql` | PostgreSQL trigger for auto profile creation |
| `middleware.ts` | Route protection & authorization |
| `src/lib/supabaseClient.ts` | Client-side Supabase instance |
| `src/lib/supabaseServerSSR.ts` | Server-side Supabase with SSR cookies |
| `src/app/login/page.tsx` | Patient login (Auth UI) |
| `src/app/admin-login/page.tsx` | Superadmin login (custom form) |
| `src/app/auth/callback/route.ts` | OAuth callback handler |
| `src/app/patient-dashboard/page.tsx` | Patient home page |
| `src/app/superadmin-portal/page.tsx` | Admin control panel |

## Next Steps

1. **Create additional staff/dentist login pages** (similar to patient login)
2. **Build clinic management UI** in superadmin portal
3. **Create appointment booking system**
4. **Add patient records management**
5. **Implement role-based UI components** for different user types
6. **Set up audit logging** for compliance

## Troubleshooting

### Trigger Not Firing
- Ensure you executed `database/triggers.sql` in Supabase SQL Editor
- Check that `auth.users` table exists (auto-created by Supabase)
- Verify RLS policies allow inserts to `public.users` and `public.patients`

### OAuth Not Working
- Verify OAuth provider (Google) is configured in Supabase Dashboard
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Ensure redirect URL includes `/auth/callback`

### Superadmin Access Denied
- Check user's role in `public.users` table is set to `'superadmin'`
- Verify middleware.ts is in root directory (not nested)
- Clear browser cookies and try again

## Support

For Supabase documentation, visit: https://supabase.com/docs
