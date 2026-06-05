// src/app/page.tsx
import { createClient } from '@/lib/supabase/serverSSR'
import { PageShell } from './components/PageShell'
import { MapPin } from 'lucide-react'

// Import your newly migrated layout sections
import { Header } from "@/components/features/landing-page/Header"
import { Hero } from "@/components/features/landing-page/Hero"
import { Features } from "@/components/features/landing-page/Features"
import { HowItWorks } from "@/components/features/landing-page/HowItWorks"
import { Footer } from "@/components/features/landing-page/Footer"
import { ClinicMap } from "@/components/features/landing-page/ClinicMap"

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  latitude: number | null
  longitude: number | null
  clinic_hmo: { hmo_name: string }[]
  clinic_specialties: { specialty_name: string }[]
  clinic_operating_hours: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }[]
  feedback: { rating: number }[]
}

export default async function Home() {
  // Fetch real-time active clinics from your database
  const supabase = await createClient()

  const { data: clinics } = await supabase
    .from('clinics')
    .select(`
      id, name, address, phone, latitude, longitude,
      clinic_hmo(hmo_name),
      clinic_specialties(specialty_name),
      clinic_operating_hours(day_of_week, open_time, close_time, is_closed),
      feedback(rating)
    `)
    .eq('is_active', true)

  const clinicsList: Clinic[] = clinics || []

  return (
    <div className="relative min-h-screen bg-background antialiased">
      {/* 1. New Elegant Navigation Bar */}
      <Header />
      
      <main>
        {/* 2. Brand New Hero Section (with Book Appointment buttons) */}
        <Hero />

        {/* 2.5 Interactive Clinic Map Section */}
        <section id="clinic-map" className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50 border-b">
          <PageShell>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="text-center max-w-3xl mx-auto mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm mb-4 font-medium shadow-sm">
                  <MapPin className="w-4 h-4" />
                  Interactive Map
                </div>
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                  Find a Clinic Near You
                </h2>
                <p className="text-xl text-gray-600">
                  Discover partner clinics near you with our interactive map. Filter by health card, rating, and status.
                </p>
              </div>
              <ClinicMap clinics={clinicsList} />
            </div>
          </PageShell>
        </section>
        
        {/* 4. Beautiful Presentational Core Feature Grid */}
        <Features />
        
        {/* 5. Smooth Step-by-Step Process Infographic */}
        <HowItWorks />
      </main>

      {/* 6. Complete Branding Footer Component */}
      <Footer /> {/* <-- ADDED COMPONENT */}
    </div>
  )
}