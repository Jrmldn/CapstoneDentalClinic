'use client'

import { User, Phone, Calendar, FileText, ClipboardList } from 'lucide-react'
import type { PatientSummary } from './PatientsClient'
import { formatPhone } from '@/utils/phone-helpers'

interface PatientCardProps {
  patient: PatientSummary
  onViewRecord: (id: number) => void
}

export default function PatientCard({ patient, onViewRecord }: PatientCardProps) {
  const birthDate = new Date(patient.birthdate)
  const age = new Date().getFullYear() - birthDate.getFullYear()

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group relative">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
          <User className="w-5 h-5" />
        </div>
        {patient.is_guest ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Guest Walk-In
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            Registered Patient
          </span>
        )}
      </div>

      <div>
        <h3 className="font-bold text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition">
          {patient.last_name}, {patient.first_name}
        </h3>
        <div className="space-y-1 mt-2 text-xs text-gray-500">
          <p className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            {formatPhone(patient.phone)}
          </p>
          {patient.email && (
            <p className="flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              {patient.email}
            </p>
          )}
          <p className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {patient.birthdate} ({age} yrs old, {patient.gender})
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-50 flex gap-2">
        <button
          onClick={() => onViewRecord(patient.id)}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-600 hover:text-white transition"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          View Clinical Record
        </button>
      </div>
    </div>
  )
}
