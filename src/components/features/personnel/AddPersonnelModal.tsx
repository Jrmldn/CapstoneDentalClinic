'use client'

import React from 'react'
import { X } from 'lucide-react'
import { useAddPersonnel } from '@/components/features/personnel/useAddPersonnel'


interface AddPersonnelModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'staff' | 'dentists'
}

/**
 * AddPersonnelModal Component
 * Renders the modal overlay form for adding new staff members or dentists.
 * State management and submit transitions are delegated to the useAddPersonnel hook.
 */
export default function AddPersonnelModal({ isOpen, onClose, onSuccess, type }: AddPersonnelModalProps) {
  const {
    clinics,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    clinicId,
    setClinicId,
    specialty,
    setSpecialty,
    isSubmitting,
    error,
    handleSubmit,
  } = useAddPersonnel({ isOpen, onClose, onSuccess, type })

  if (!isOpen) return null

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