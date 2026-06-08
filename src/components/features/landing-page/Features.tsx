import {
  UserPlus,
  FileCheck,
  MapPin,
  Filter,
  Building2,
  Calendar,
  CreditCard,
  MessageCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: UserPlus,
    title: "One-Time Registration",
    description: "Create your account once with personal information and medical history - reusable across all partner clinics.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: FileCheck,
    title: "Informed Consent",
    description: "Digital consent forms acceptance during registration for a seamless and paperless experience.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: MapPin,
    title: "Find Nearby Clinics",
    description: "Interactive map view showing the nearest dental clinics based on your current location.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Filter,
    title: "Smart Filtering",
    description: "Filter clinics by specialty, accepted HMO/health card, ratings, and open/closed hours.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Building2,
    title: "Clinic Profiles",
    description: "Detailed profiles with photo galleries, available services, equipment, and real patient reviews.",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: Calendar,
    title: "Smart Booking",
    description: "Book, reschedule, or cancel appointments with an intelligent calendar that prevents double-bookings.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Easy down payments via GCash, Credit Card, and PayMaya with secure payment processing.",
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    icon: MessageCircle,
    title: "AI Chatbot Assistant",
    description: "24/7 NLP-powered chatbot for FAQs, booking assistance, and instant support whenever you need it.",
    gradient: "from-violet-500 to-purple-500",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm mb-4">
            Features

          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Better Dental Care
          </h2>
          <p className="text-xl text-gray-600">
            Comprehensive tools designed to make managing your dental health easier than ever before.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200"
            >
              <CardContent className="p-6 space-y-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
