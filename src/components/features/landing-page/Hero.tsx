import { Calendar } from "lucide-react";
import Image from "next/image"; // FIX: Imported next/image

export function Hero({
  clinicsCount = 0,
  patientsCount = 0,
  averageRating = 4.9
}: {
  clinicsCount?: number
  patientsCount?: number
  averageRating?: number
}) {
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K+'
    }
    return count > 0 ? count + '+' : '0'
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Now Available for Patients
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Dental Health,
                <span className="text-blue-600"> Simplified</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                Book appointments, manage your dental records, and find the perfect clinic - all in one powerful platform designed for patients.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <a
                href="#clinic-map"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 text-center text-sm sm:text-base"
              >
                Find a Clinic
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white text-blue-600 border border-blue-200 font-semibold hover:bg-blue-50 transition text-center text-sm sm:text-base"
              >
                Book Appointment
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 border-t border-gray-200">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCount(clinicsCount)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Partner Clinics</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCount(patientsCount)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Happy Patients</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Average Rating</div>
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative">
            <Image
              src="/assets/hero-dental.webp"
              alt="Dental Care Illustration"
              width={800}
              height={600}
              priority
              className="w-full h-auto rounded-2xl shadow-lg"
            />

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-6 max-w-xs">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Next Available</div>
                  <div className="text-sm text-gray-600">Today at 2:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 right-0 -z-10 opacity-20">
        <svg width="404" height="404" fill="none" viewBox="0 0 404 404">
          <defs>
            <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="4" height="4" className="text-blue-500" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="404" fill="url(#pattern)" />
        </svg>
      </div>
    </section>
  );
}
