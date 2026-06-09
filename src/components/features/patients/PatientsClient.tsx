'use client'

import { useState } from 'react'
import { Search, Plus, User, RefreshCw } from 'lucide-react'
import { fetchPatientRecord } from '@/actions/patientActions'
import RegisterPatientModal from './RegisterPatientModal'
import PatientCard from './PatientCard'
import PatientRecordModal, { PatientRecord } from './PatientRecordModal'

export interface PatientSummary {
  id: number
  first_name: string
  last_name: string
  phone: string
  email: string | null
  birthdate: string
  gender: string
  is_guest: boolean
  created_at: string
}

interface PatientsClientProps {
  clinicId: number
  initialPatients: PatientSummary[]
}

export default function PatientsClient({ clinicId, initialPatients }: PatientsClientProps) {
  const [patients, setPatients] = useState<PatientSummary[]>(initialPatients)
  const [searchTerm, setSearchTerm] = useState('')
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<PatientRecord | null>(null)
  const [isLoadingRecord, setIsLoadingRecord] = useState(false)

  // View Record Handler
  const handleViewRecord = async (patientId: number) => {
    setIsLoadingRecord(true)
    const viewResult = await fetchPatientRecord(patientId, clinicId)
    setIsLoadingRecord(false)
    if (viewResult.success && viewResult.record) {
      setSelectedPatientRecord(viewResult.record as PatientRecord)
    } else {
      alert(viewResult.error || 'Failed to load patient record')
    }
  }

  // Success handler for patient registration
  const handleRegisterSuccess = (newPatient: PatientSummary) => {
    alert('Patient registered successfully!')
    setPatients(prev => [newPatient, ...prev])
    setIsRegisterModalOpen(false)
  }

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      (p.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name, phone or email..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Register Patient
        </button>
      </div>

      {/* Patients List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPatients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onViewRecord={handleViewRecord}
          />
        ))}

        {filteredPatients.length === 0 && (
          <div className="col-span-full py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-500 font-medium">No patients found</h3>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search query or register a new patient.</p>
          </div>
        )}
      </div>

      {/* Loading Modal */}
      {isLoadingRecord && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white p-5 rounded-xl shadow-lg flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-700">Loading Clinical Records...</span>
          </div>
        </div>
      )}

      {/* MODAL: Register Patient */}
      <RegisterPatientModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        clinicId={clinicId}
        onSuccess={handleRegisterSuccess}
      />

      {/* MODAL: Full Patient Record */}
      <PatientRecordModal
        record={selectedPatientRecord}
        onClose={() => setSelectedPatientRecord(null)}
      />
    </div>
  )
}