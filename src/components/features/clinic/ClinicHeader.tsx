'use client'

import { Plus } from 'lucide-react'

interface ClinicHeaderProps {
  onAddClick: () => void
}

export default function ClinicHeader({ onAddClick }: ClinicHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clinics &amp; Branches</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage clinic branches and their operational status across the system.
        </p>
      </div>
      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg hover:shadow-lg transition font-medium"
      >
        <Plus className="w-4 h-4" />
        Add a new Clinic
      </button>
    </div>
  )
}
