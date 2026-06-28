const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return process.env;
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

async function resetPasswords() {
  const env = getEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const targetUsers = [
    { email: 'dentistclinic1@gmail.com', password: 'password123' },
    { email: 'stephencurry@gmail.com', password: 'password123' }
  ];

  console.log('Fetching users from auth...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing auth users:', error);
    return;
  }

  for (const target of targetUsers) {
    const user = users.find(u => u.email === target.email);
    if (!user) {
      console.log(`User ${target.email} not found in auth!`);
      continue;
    }

    console.log(`Found user ${target.email} with ID: ${user.id}. Resetting password to ${target.password}...`);
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: target.password }
    );

    if (updateError) {
      console.error(`Error updating password for ${target.email}:`, updateError);
    } else {
      console.log(`Successfully reset password for ${target.email}!`);
    }
  }
}

resetPasswords();
