// src/app/page.tsx
import { createClient } from '@/lib/supabase/serverSSR'
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
  manual_status: string | null
  latitude: number | null
  longitude: number | null
  clinic_hmo: { hmo_name: string }[]
  clinic_specialties: { specialty_name: string }[]
  clinic_operating_hours: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }[]
  clinic_gallery: { image_url: string; sort_order: number }[]
  feedback: { rating: number }[]
}

export default async function Home() {
  // Use the standard client (anon) for public browsing. 
  // IMPORTANT: Ensure you have run database/003_fix_public_rls_policies.sql 
  // so public users can readJoined data like specialties and feedback.
  const supabase = await createClient()

  const { data: clinics } = await supabase
    .from('clinics')
    .select(`
      id, name, address, phone, manual_status, latitude, longitude,
      clinic_hmo(hmo_name),
      clinic_specialties(specialty_name),
      clinic_operating_hours(day_of_week, open_time, close_time, is_closed),
      clinic_gallery(image_url, sort_order),
      feedback(rating)
    `)
    .eq('is_active', true)

  // Fetch all unique specialties and HMOs for filters
  const { data: allSpecialties } = await supabase
    .from('clinic_specialties')
    .select('specialty_name')

  const { data: allHMOs } = await supabase
    .from('clinic_hmo')
    .select('hmo_name')

  // Also fetch specialties from dentists table as a fallback
  const { data: dentistSpecialties } = await supabase
    .from('dentists')
    .select('specialty')

  const clinicsList: Clinic[] = clinics || []

  // Extract unique names and filter out empty values
  const specialtyOptions = Array.from(new Set([
    ...(allSpecialties || []).map(s => s.specialty_name),
    ...(dentistSpecialties || []).map(d => d.specialty)
  ])).filter(Boolean).sort()

  const hmoOptions = Array.from(new Set((allHMOs || []).map(h => h.hmo_name))).filter(Boolean).sort()

  return (
    <div className="relative min-h-screen bg-background antialiased">
      {/* 1. New Elegant Navigation Bar */}
      <Header />
      
      <main>
        {/* 2. Brand New Hero Section (with Book Appointment buttons) */}
        <Hero />

        {/* 2.5 Interactive Clinic Map Section */}
        <section id="clinic-map" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/80 text-blue-700 rounded-full text-sm mb-4 font-medium shadow-sm">
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
            <ClinicMap 
              clinics={clinicsList} 
              availableSpecialties={specialtyOptions}
              availableHMOs={hmoOptions}
            />
          </div>
        </section>
        
        {/* 4. Beautiful Presentational Core Feature Grid */}
        <Features />
        
        {/* 5. Smooth Step-by-Step Process Infographic */}
        <HowItWorks />
      </main>

      {/* 6. Complete Branding Footer Component */}
      <Footer />
    </div>
  )
}
