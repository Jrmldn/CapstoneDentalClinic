'use client'

import React from 'react'
import { X } from 'lucide-react'
import { FormattedStaff, FormattedDentist } from '@/types/clinic'

import { useEditPersonnel } from '@/components/features/personnel/useEditPersonnel'

const SPECIALTIES = [
  'General Dentistry',
  'Orthodontics',
  'Endodontics',
  'Periodontics',
  'Oral Surgery',
  'Pediatric Dentistry',
  'Prosthodontics',
  'Oral Pathology',
]


interface EditPersonnelModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
  person: FormattedStaff | FormattedDentist | null
  type: 'staff' | 'dentist'
  clinics: { id: number; name: string }[]
  fixedClinicId?: number
}

export default function EditPersonnelModal({
  isOpen,
  onClose,
  onSuccess,
  person,
  type,
  clinics,
  fixedClinicId
}: EditPersonnelModalProps) {
  const {
    formData,
    setFormData,
    isSubmitting,
    error,
    handleSubmit,
  } = useEditPersonnel({ onClose, onSuccess, person, type })

  if (!isOpen || !person) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900">
            Edit {type === 'staff' ? 'Staff Member' : 'Dentist'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-900 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-900 text-sm">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium">First Name</label>
              <input 
                required 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" 
                value={formData.firstName} 
                onChange={e => setFormData({...formData, firstName: e.target.value})} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium">Last Name</label>
              <input 
                required 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" 
                value={formData.lastName} 
                onChange={e => setFormData({...formData, lastName: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium">Email Address</label>
            <input 
              required 
              disabled 
              className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-500" 
              value={formData.email} 
            />
          </div>

          {!fixedClinicId && (
            <div className="space-y-1.5">
              <label className="font-medium">Clinic</label>
              <select 
                required 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white" 
                value={formData.clinicId} 
                onChange={e => setFormData({...formData, clinicId: e.target.value})}
              >
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {type === 'dentist' && (
            <div className="space-y-1.5">
              <label className="font-medium">Specialty</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                value={formData.specialty}
                onChange={e => setFormData({...formData, specialty: e.target.value})}
              >
                <option value="">Select a specialty...</option>
                {SPECIALTIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}