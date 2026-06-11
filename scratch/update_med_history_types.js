const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../database/supabase-types.ts');
let content = fs.readFileSync(filePath, 'utf16le');

const rowTarget = `      patient_medical_history: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          current_medications: string[] | null
          id: number
          is_pregnant: boolean | null
          is_smoker: boolean | null
          medical_conditions: string[] | null
          patient_id: number
          previous_surgeries: string | null
          updated_at: string | null
        }`;

const rowReplacement = `      patient_medical_history: {
        Row: {
          allergies: string[] | null
          blood_pressure: string | null
          blood_type: string | null
          current_medications: string[] | null
          id: number
          is_pregnant: boolean | null
          is_smoker: boolean | null
          medical_conditions: string[] | null
          medical_flags: string | null
          patient_id: number
          previous_surgeries: string | null
          updated_at: string | null
        }`;

const insertTarget = `        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          current_medications?: string[] | null
          id?: number
          is_pregnant?: boolean | null
          is_smoker?: boolean | null
          medical_conditions?: string[] | null
          patient_id: number
          previous_surgeries?: string | null
          updated_at?: string | null
        }`;

const insertReplacement = `        Insert: {
          allergies?: string[] | null
          blood_pressure?: string | null
          blood_type?: string | null
          current_medications?: string[] | null
          id?: number
          is_pregnant?: boolean | null
          is_smoker?: boolean | null
          medical_conditions?: string[] | null
          medical_flags?: string | null
          patient_id: number
          previous_surgeries?: string | null
          updated_at?: string | null
        }`;

const updateTarget = `        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          current_medications?: string[] | null
          id?: number
          is_pregnant?: boolean | null
          is_smoker?: boolean | null
          medical_conditions?: string[] | null
          patient_id?: number
          previous_surgeries?: string | null
          updated_at?: string | null
        }`;

const updateReplacement = `        Update: {
          allergies?: string[] | null
          blood_pressure?: string | null
          blood_type?: string | null
          current_medications?: string[] | null
          id?: number
          is_pregnant?: boolean | null
          is_smoker?: boolean | null
          medical_conditions?: string[] | null
          medical_flags?: string | null
          patient_id?: number
          previous_surgeries?: string | null
          updated_at?: string | null
        }`;

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
  console.error('Could not find rowTarget in patient_medical_history!');
  process.exit(1);
}
if (!normalizedContent.includes(normalizedInsertTarget)) {
  console.error('Could not find insertTarget in patient_medical_history!');
  process.exit(1);
}
if (!normalizedContent.includes(normalizedUpdateTarget)) {
  console.error('Could not find updateTarget in patient_medical_history!');
  process.exit(1);
}

let updated = normalizedContent
  .replace(normalizedRowTarget, normalizedRowReplacement)
  .replace(normalizedInsertTarget, normalizedInsertReplacement)
  .replace(normalizedUpdateTarget, normalizedUpdateReplacement);

const useCRLF = content.includes('\r\n');
if (useCRLF) {
  updated = updated.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, updated, 'utf16le');
console.log('Successfully updated supabase-types.ts with medical history fields!');
