'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface InformedConsentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function InformedConsentModal({ isOpen, onClose }: InformedConsentModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Informed Consent Form</h2>
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
            <h3 className="font-semibold text-gray-900 mb-1">1. Consent to Dental Care</h3>
            <p>
              I hereby consent to receive diagnostic, preventative, and therapeutic dental treatment
              and care from the clinic's licensed dental practitioners. This includes but is not
              limited to dental cleanings, examinations, X-rays, local anesthesia, fillings, and
              other routine clinical procedures.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">2. Acknowledgment of Risks</h3>
            <p>
              I acknowledge that dental treatments, like any medical procedure, involve potential risks,
              including but not limited to sensitivity, bleeding, swelling, infection, or reaction to
              anesthesia. I understand that the dentist will explain specific treatment plans and associated
              risks before initiating any major procedures.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">3. Record Keeping &amp; Clinical Data Sharing</h3>
            <p>
              I consent to my dental records, history, dental charts, photographs, and clinical notes
              being recorded in the clinic's system. I understand and agree that this clinical data
              will be shared securely with my treating dentists and clinic staff to facilitate my ongoing
              treatment and care.
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
