'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import { Clinic } from '@/types' // FIX: Imported Clinic type

interface ClinicFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ClinicFormData & { latitude: number | null; longitude: number | null }) => void
  isSaving?: boolean
  initialData?: Clinic | null // FIX: Replaced any
}

interface ClinicFormData {
  name: string
  email: string
  phone: string
  address: string
  dailyCapacity: number
  latitude: string
  longitude: string
}

export default function ClinicFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  initialData,
}: ClinicFormModalProps) {
  const isEditMode = !!initialData

  // FIX: Initializing state directly to avoid useEffect cascading renders. Key in parent handles resets.
  const [formData, setFormData] = useState<ClinicFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    dailyCapacity: initialData?.max_appointments_per_day || 0,
    latitude: initialData?.latitude?.toString() ?? '',
    longitude: initialData?.longitude?.toString() ?? '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dailyCapacity' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      latitude: formData.latitude !== '' ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude !== '' ? parseFloat(formData.longitude) : null,
    }) // FIX: Removed as any
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Clinic' : 'Add Clinic'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 hover:bg-gray-100 rounded transition disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter clinic name"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
              required
              disabled={isSaving}
            />
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="clinic@example.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
                required
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Phone number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+63 912 345 6789"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
                required
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter clinic address"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition resize-none disabled:bg-gray-100"
              required
              disabled={isSaving}
            />
          </div>

          {/* Daily Capacity */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Daily Capacity</label>
            <input
              type="number"
              name="dailyCapacity"
              value={formData.dailyCapacity || ''}
              onChange={handleChange}
              placeholder="Enter maximum daily patients"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
              min="1"
              required
              disabled={isSaving}
            />
            <p className="text-xs text-gray-500 mt-1">
              The maximum number of patients this clinic can schedule in one day.
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Latitude (e.g. 14.5995)"
                step="any"
                min="-90"
                max="90"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
                disabled={isSaving}
              />
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Longitude (e.g. 120.9842)"
                step="any"
                min="-180"
                max="180"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
                disabled={isSaving}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Right-click the clinic location on Google Maps and copy the coordinates.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              {isSaving ? 'Saving...' : isEditMode ? 'Update Clinic' : 'Save Clinic'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}