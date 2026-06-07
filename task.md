Act as a Senior React, TypeScript, and Supabase Developer. I have successfully updated my database schema by creating a `clinic_patients` junction table to isolate patient records per clinic while preserving a global patient directory. 

Act as a Senior React, TypeScript, and Supabase Developer.

### My Actual Table Structures:

patients:
- id          BIGINT (primary key)
- user_id     UUID
- first_name  TEXT
- last_name   TEXT
- phone       TEXT
- birthdate   DATE
- gender      TEXT
- address     TEXT
- is_guest    BOOLEAN
- created_at  TIMESTAMPTZ

clinic_patients:
- id          BIGINT (primary key)
- clinic_id   BIGINT (FK → clinics.id)
- patient_id  BIGINT (FK → patients.id)
- is_active   BOOLEAN
- enrolled_by UUID (FK → users.id)
- created_at  TIMESTAMPTZ
- UNIQUE(clinic_id, patient_id)

The Task:
I need you to help me refactor my frontend Next.js / React components (written in TypeScript) to safely query and write data using this new schema.

Please provide clean, production-ready code blocks and logical explanations for the following three implementations:

The Dropdown Fetching Logic (Inner Joins):
Write a Supabase Client query that fetches only the active patients associated with the current clinic (currentClinicId). Because Supabase returns joined data as a nested object, show me how to type the TypeScript interface for this response and how to correctly map over the data (e.g., handling item.patients.first_name) inside a standard Tailwind CSS / React select menu dropdown.

Sequential Multi-Step Form Submission Handler:
Write an asynchronous handleSubmit function for a "Register New Patient" form. The function must handle two sequential operations:

Step 1: Insert the new profile data into the global patients table and immediately return the newly generated id.

Step 2: Use that returned patient_id along with the currentClinicId and the logged-in userId (for enrolled_by) to insert a new row into the clinic_patients table.

Include clear try/catch error handling to stop the operation if the global profile creation fails.

Updating the Patient Directory List View:
Provide a quick example of how to fetch and state-manage this same data for a tabular grid layout (Patient Directory page) so it properly renders the localized roster for the logged-in clinic.

Please write modern, humanized React code, utilizing standard async/await syntax and clean TypeScript type definitions.