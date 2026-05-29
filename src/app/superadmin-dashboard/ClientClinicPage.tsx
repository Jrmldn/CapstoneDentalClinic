'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ClinicHeader from './components/ClinicHeader'
import ClinicFilters from './components/ClinicFilters'
import ClinicTable from './components/ClinicTable'
import AddClinicModal from './components/AddClinicModal'
import { addClinic, fetchClinics } from '@/app/actions/clinicActions'

interface ClinicData {
  id: number
  name: string
  is_active: boolean
  email: string
  phone: string
  address: string
  max_appointments_per_day: number
  latitude?: number
  longitude?: number
  created_at?: string
}

export default function ClientClinicPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clinics, setClinics] = useState<ClinicData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadClinics()
  }, [])

  const loadClinics = async () => {
    setIsLoading(true)
    const result = await fetchClinics()
    if (result.success) {
      setClinics(result.clinics)
    }
    setIsLoading(false)
  }

  const handleAddClinic = async (data: any) => {
    setIsSaving(true)
    const result = await addClinic(data)
    
    if (result.success) {
      setIsModalOpen(false)
      await loadClinics()
    } else {
      alert('Error adding clinic: ' + result.error)
    }
    setIsSaving(false)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <ClinicHeader onAddClick={() => setIsModalOpen(true)} />

      {/* Filters */}
      <ClinicFilters />

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Loading clinics...</p>
        </div>
      ) : (
        <ClinicTable clinics={clinics} onRefresh={loadClinics} />
      )}

      {/* Modal */}
      <AddClinicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddClinic}
        isSaving={isSaving}
      />
    </div>
  )
}
