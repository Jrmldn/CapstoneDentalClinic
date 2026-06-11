const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return process.env;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = { ...process.env };
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  });
  return env;
}

async function check() {
  const env = getEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: dentists, error: err1 } = await supabase.from('dentists').select('*');
  console.log('Dentists:', dentists, err1);
  const { data: users, error: err2 } = await supabase.from('users').select('*').eq('role', 'dentist');
  console.log('Dentist Users:', users, err2);
}

check();
