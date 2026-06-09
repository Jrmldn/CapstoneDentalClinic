'use client'

import { useState } from 'react'
import { X, RefreshCw, AlertTriangle } from 'lucide-react'
import { registerPatient } from '@/actions/patientActions'
import { PatientSummary } from './PatientsClient'

interface RegisterPatientModalProps {
  isOpen: boolean
  onClose: () => void
  clinicId: number
  onSuccess: (newPatient: PatientSummary) => void
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  birthdate: '',
  gender: 'male',
  address: '',
  bloodType: '',
  allergies: '',
  medications: '',
  conditions: ''
}

export default function RegisterPatientModal({ isOpen, onClose, clinicId, onSuccess }: RegisterPatientModalProps) {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleClose = () => {
    setFormData(EMPTY_FORM)
    setFormError('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    const allergiesArr = formData.allergies.split(',').map(s => s.trim()).filter(Boolean)
    const medsArr = formData.medications.split(',').map(s => s.trim()).filter(Boolean)
    const condsArr = formData.conditions.split(',').map(s => s.trim()).filter(Boolean)

    const result = await registerPatient({
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      email: formData.email.trim() || undefined,
      birthdate: formData.birthdate,
      gender: formData.gender,
      address: formData.address,
      blood_type: formData.bloodType || undefined,
      allergies: allergiesArr.length > 0 ? allergiesArr : undefined,
      current_medications: medsArr.length > 0 ? medsArr : undefined,
      medical_conditions: condsArr.length > 0 ? condsArr : undefined,
      is_guest: false,
      clinic_id: clinicId
    })

    setIsSubmitting(false)

    if (result.success && result.patient) {
      alert('Patient registered successfully!')
      const newPatient: PatientSummary = {
        id: result.patient.id,
        first_name: result.patient.first_name,
        last_name: result.patient.last_name,
        phone: result.patient.phone,
        email: result.patient.email ?? null,
        birthdate: result.patient.birthdate,
        gender: result.patient.gender,
        is_guest: result.patient.is_guest,
        created_at: result.patient.created_at
      }
      onSuccess(newPatient)
      setFormData(EMPTY_FORM)
      onClose()
    } else {
      setFormError(result.error || 'Failed to register patient')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-lg">Register Patient</h3>
          <button onClick={handleClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Personal Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 border-b border-gray-100 pb-1">Personal Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">First Name *</span>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Last Name *</span>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Phone Number *</span>
                <input
                  type="tel"
                  required
                  placeholder="09XXXXXXXXX"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Email Address</span>
                <input
                  type="email"
                  placeholder="optional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Birthdate *</span>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                  value={formData.birthdate}
                  onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Gender *</span>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-xs font-semibold text-slate-600">Home Address</span>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 border-b border-gray-100 pb-1">Medical Profile (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Blood Type</span>
                <input
                  type="text"
                  placeholder="e.g. O+, A-"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                  value={formData.bloodType}
                  onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Allergies (comma-separated)</span>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Latex"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                  value={formData.allergies}
                  onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Current Medications (comma-separated)</span>
                <input
                  type="text"
                  placeholder="e.g. Aspirin, Metformin"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                  value={formData.medications}
                  onChange={e => setFormData({ ...formData, medications: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Medical Conditions (comma-separated)</span>
                <input
                  type="text"
                  placeholder="e.g. Diabetes, Hypertension"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                  value={formData.conditions}
                  onChange={e => setFormData({ ...formData, conditions: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
