'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { addStaff, addDentist } from '@/actions/personnelActions'
import { getClinics } from '@/lib/queries/clinics'

interface AddPersonnelModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'staff' | 'dentists'
}

export default function AddPersonnelModal({ isOpen, onClose, onSuccess, type }: AddPersonnelModalProps) {
  const [clinics, setClinics] = useState<{ id: number; name: string }[]>([])
  
  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clinicId, setClinicId] = useState('')
  const [specialty, setSpecialty] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Fetch clinics for the dropdown when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchClinics = async () => {
        const result = await getClinics()
        if (result.success && result.data) {
          setClinics(result.data)
        }
      }
      fetchClinics()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (!clinicId) {
      setError('Please select a clinic to assign this user to.')
      setIsSubmitting(false)
      return
    }

    try {
      const baseData = {
        firstName,
        lastName,
        email,
        password,
        clinicId: parseInt(clinicId)
      }

      let result
      if (type === 'staff') {
        result = await addStaff(baseData)
      } else {
        result = await addDentist({ ...baseData, specialty })
      }

      if (result.success) {
        // Reset form and close
        setFirstName('')
        setLastName('')
        setEmail('')
        setPassword('')
        setClinicId('')
        setSpecialty('')
        onSuccess() 
        onClose()
      } else {
        setError(result.error || `Failed to add ${type}`)
      }
    } catch (err) { // FIX: Removed any
      setError(err instanceof Error ? err.message : 'An unknown error occurred') // FIX: Added type guard
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900">
            Add New {type === 'staff' ? 'Staff Member' : 'Dentist'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-900 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-900 text-sm">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium">First Name</label>
              <input
                required
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium">Last Name</label>
              <input
                required
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium">Email Address</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium">Temporary Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              minLength={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium">Assign to Clinic</label>
            <select
              required
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition bg-white"
            >
              <option value="">Select a clinic...</option>
              {clinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          {type === 'dentists' && (
            <div className="space-y-1.5">
              <label className="font-medium">Specialty</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Orthodontist, General Dentistry"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition"
              />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}