'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Terms and Conditions</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4 text-sm text-gray-700 space-y-5">
          <p className="text-xs text-gray-400">Last updated: June 2026</p>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">1. Acceptance of Terms</h3>
            <p>
              By creating an account on AppointDent, you confirm that you have read, understood, and
              agree to be bound by these Terms and Conditions. If you do not agree, please do not
              register or use this platform.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">2. Services Offered</h3>
            <p>
              AppointDent provides an online dental clinic management portal that allows patients to
              book appointments, view dental records, and manage billing with participating dental
              clinics. The platform does not provide direct medical advice or treatment.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">3. Patient Privacy &amp; Data Use</h3>
            <p>
              We collect and process personal health information (PHI) solely to facilitate your
              dental care appointments and records. Your data is stored securely and is not sold or
              shared with third parties outside of your treating dental clinic. You have the right
              to request access to, correction of, or deletion of your personal data at any time by
              contacting your clinic directly.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">4. Account Responsibilities</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials.
              Any activity that occurs under your account is your responsibility. Notify your clinic
              immediately if you suspect unauthorized access to your account.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">5. Appointment Cancellation Policy</h3>
            <p>
              Appointments must be cancelled or rescheduled at least 24 hours in advance. Repeated
              no-shows or last-minute cancellations may result in restrictions on future bookings, at
              the discretion of the dental clinic.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">6. Limitation of Liability</h3>
            <p>
              AppointDent is a scheduling and records platform only. We are not liable for any
              clinical outcomes, treatment decisions, or disputes between patients and dental
              providers. Our liability is limited to the extent permitted by applicable law.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">7. Changes to Terms</h3>
            <p>
              These Terms and Conditions may be updated from time to time. Continued use of the
              platform after changes are posted constitutes your acceptance of the revised terms.
              We recommend reviewing this page periodically.
            </p>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
