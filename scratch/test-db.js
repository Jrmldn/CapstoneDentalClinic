const fs = require('fs');
const path = require('path');

const typesPath = path.join(__dirname, '../database/supabase-types.ts');
if (fs.existsSync(typesPath)) {
  const content = fs.readFileSync(typesPath, 'utf-16le');
  const lines = content.split('\n');
  let inAppointments = false;
  let braces = 0;
  
  console.log("Printing appointments table structure...");
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.includes('appointments: {')) {
      inAppointments = true;
    }
    if (inAppointments) {
      console.log(`[${idx + 1}] ${line.trim()}`);
      if (line.includes('{')) braces++;
      if (line.includes('}')) braces--;
      if (braces === 0 && line.includes('}')) {
        break;
      }
    }
  }
} else {
  console.log("types file not found");
}
