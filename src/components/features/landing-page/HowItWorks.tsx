import { UserPlus, Search, Calendar, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    description: "Register once with your personal and medical information. Your profile works across all partner clinics.",
    step: "01",
  },
  {
    icon: Search,
    title: "Find the Perfect Clinic",
    description: "Browse nearby clinics on the map, filter by specialty, ratings, and availability.",
    step: "02",
  },
  {
    icon: Calendar,
    title: "Book Your Appointment",
    description: "Select a convenient time slot, make your down payment securely, and get instant confirmation.",
    step: "03",
  },
  {
    icon: CheckCircle,
    title: "Arrive & Get Treated",
    description: "Show up at your scheduled time. Your medical history is already on file - no paperwork needed!",
    step: "04",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-full text-sm mb-4 shadow-sm">
            How It Works
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Getting Started is Easy
          </h2>
          <p className="text-xl text-gray-600">
            Four simple steps to better dental care management
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line - Hidden on mobile */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 -z-10"></div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Card */}
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-8">
                    <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                      {step.step}
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-blue-600" />
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
