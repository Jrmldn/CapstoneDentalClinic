const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../database/supabase-types.ts');
let content = fs.readFileSync(filePath, 'utf16le');

// We will do string replacement on the UTF-16 content.
// Row target:
const rowTarget = `        Row: {
          clinic_id: number
          first_name: string
          id: number
          last_name: string
          specialty: string | null
          user_id: string
        }`;

const rowReplacement = `        Row: {
          clinic_id: number
          first_name: string
          id: number
          last_name: string
          license_no: string | null
          specialty: string | null
          user_id: string
        }`;

// Insert target:
const insertTarget = `        Insert: {
          clinic_id: number
          first_name: string
          id?: number
          last_name: string
          specialty?: string | null
          user_id: string
        }`;

const insertReplacement = `        Insert: {
          clinic_id: number
          first_name: string
          id?: number
          last_name: string
          license_no?: string | null
          specialty?: string | null
          user_id: string
        }`;

// Update target:
const updateTarget = `        Update: {
          clinic_id?: number
          first_name?: string
          id?: number
          last_name?: string
          specialty?: string | null
          user_id?: string
        }`;

const updateReplacement = `        Update: {
          clinic_id?: number
          first_name?: string
          id?: number
          last_name?: string
          license_no?: string | null
          specialty?: string | null
          user_id?: string
        }`;

// Normalize line endings to \r\n to match Windows encoding if present, or \n.
// Let's replace regardless of line endings. We'll do a simple replace with normalized endings.
function normalizeLineEndings(str) {
  return str.replace(/\r\n/g, '\n');
}

const normalizedContent = normalizeLineEndings(content);
const normalizedRowTarget = normalizeLineEndings(rowTarget);
const normalizedRowReplacement = normalizeLineEndings(rowReplacement);
const normalizedInsertTarget = normalizeLineEndings(insertTarget);
const normalizedInsertReplacement = normalizeLineEndings(insertReplacement);
const normalizedUpdateTarget = normalizeLineEndings(updateTarget);
const normalizedUpdateReplacement = normalizeLineEndings(updateReplacement);

if (!normalizedContent.includes(normalizedRowTarget)) {
  console.error('Could not find rowTarget in supabase-types.ts!');
  process.exit(1);
}
if (!normalizedContent.includes(normalizedInsertTarget)) {
  console.error('Could not find insertTarget in supabase-types.ts!');
  process.exit(1);
}
if (!normalizedContent.includes(normalizedUpdateTarget)) {
  console.error('Could not find updateTarget in supabase-types.ts!');
  process.exit(1);
}

let updated = normalizedContent
  .replace(normalizedRowTarget, normalizedRowReplacement)
  .replace(normalizedInsertTarget, normalizedInsertReplacement)
  .replace(normalizedUpdateTarget, normalizedUpdateReplacement);

// Restore line endings to original style. Let's see if original used \r\n
const useCRLF = content.includes('\r\n');
if (useCRLF) {
  updated = updated.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, updated, 'utf16le');
console.log('Successfully updated supabase-types.ts!');
