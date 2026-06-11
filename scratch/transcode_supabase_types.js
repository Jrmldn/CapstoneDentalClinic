const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../database/supabase-types.ts');
const content = fs.readFileSync(filePath, 'utf16le');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('blood_pressure') || line.includes('medical_flags') || line.includes('flag')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
