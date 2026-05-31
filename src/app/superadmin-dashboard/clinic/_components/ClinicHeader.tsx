'use client'

import { Plus } from 'lucide-react'

interface ClinicHeaderProps {
  onAddClick: () => void
}

export default function ClinicHeader({ onAddClick }: ClinicHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold text-gray-900">Clinic</h1>
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
