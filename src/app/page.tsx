// src/app/page.tsx
import { createClient } from '@/lib/supabase/serverSSR'
import { PageShell } from './components/PageShell'
import { ClinicCard } from './components/ClinicCard'

// Import your newly migrated layout sections
import { Header } from "@/components/features/landing-page/Header"
import { Hero } from "@/components/features/landing-page/Hero"
import { Features } from "@/components/features/landing-page/Features"
import { HowItWorks } from "@/components/features/landing-page/HowItWorks"
import { Footer } from "@/components/features/landing-page/Footer" // <-- ADDED IMPORT

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
}

export default async function Home() {
  // Fetch real-time active clinics from your database
  const supabase = await createClient()

  const { data: clinics, error } = await supabase
    .from('clinics')
    .select('id, name, address, phone')
    .eq('is_active', true)

  const clinicsList: Clinic[] = clinics || []

  return (
    <div className="relative min-h-screen bg-background antialiased">
      {/* 1. New Elegant Navigation Bar */}
      <Header />
      
      <main>
        {/* 2. Brand New Hero Section (with Book Appointment buttons) */}
        <Hero />
        
        {/* 3. Your Dynamic Database Content: Clinics Finder Grid */}
        <section id="find-clinics" className="py-16 bg-slate-50/50">
          <PageShell>
            <div className="max-w-6xl mx-auto">
              {/* Clean Section Heading */}
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Partner Clinics</h2>
                <p className="text-lg text-gray-600">
                  Find and book real-time appointments at an active dental branch near you.
                </p>
              </div>

              {/* Dynamic Clinics Render */}
              {clinicsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clinicsList.map((clinic) => (
                    <ClinicCard
                      key={clinic.id}
                      id={clinic.id}
                      name={clinic.name}
                      address={clinic.address}
                      phone={clinic.phone}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Clinics Available
                    </h3>
                    <p className="text-gray-600">
                      We're setting up clinic information. Please check back soon.
                    </p>
                  </div>
                </div>
              )}
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