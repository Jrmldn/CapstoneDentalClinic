'use client' // Necessary because we are using useEffect to fetch on the client side

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'


export default function Home() {
  const [status, setStatus] = useState<string>('Connecting to Supabase...')

  useEffect(() => {
    async function testConnection() {
      // We try to fetch any single row from your database to see if it responds
      const { data, error } = await supabase.from('services').select('*').limit(1)

      if (error) {
        // If it's just a "table not found" error, the connection actually WORKED! 
        // It means Supabase responded to your keys.
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          setStatus('Connected successfully! (The keys are working, you just need to create your tables next).')
        } else {
          setStatus(`Connection failed: ${error.message}`)
        }
      } else {
        setStatus('Connected successfully! Data fetched.')
      }
    }

    testConnection()
  }, [])

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Capstone Dental Clinic</h1>
      <p>Status: <strong>{status}</strong></p>
    </main>
  )
}