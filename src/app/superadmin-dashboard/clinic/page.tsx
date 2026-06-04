'use client'

import { useEffect, useState, useRef } from 'react'
import ClinicHeader from './_components/ClinicHeader'
import ClinicTable from './_components/ClinicTable'
import ClinicFormModal from './_components/ClinicFormModal'
import ClinicFilterBar from '@/components/features/clinic/ClinicFilterBar'
import { addClinic, updateClinic, fetchClinics } from '@/actions/clinicActions'

interface ClinicData {
  id: number
  name: string
  is_active: boolean
  email: string
  phone: string
  address: string
  max_appointments_per_day: number
  latitude?: number | null
  longitude?: number | null
  created_at?: string
}

const ITEMS_PER_PAGE = 10

export default function ClientClinicPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<ClinicData | null>(null)
  const [clinics, setClinics] = useState<ClinicData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const isFirstRender = useRef(true)

  useEffect(() => {
    loadClinics(true)
    isFirstRender.current = false
  }, [])

  useEffect(() => {
    if (isFirstRender.current) return
    loadClinics(false)
  }, [currentPage])

  useEffect(() => {
    if (isFirstRender.current) return
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1)
      loadClinics(false)
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, statusFilter])

  const loadClinics = async (showLoadingScreen = true) => {
    if (showLoadingScreen) setIsLoading(true)
    const result = await fetchClinics(searchQuery, statusFilter, currentPage, ITEMS_PER_PAGE)
    if (result.success) {
      setClinics(result.clinics)
      setTotalCount(result.totalCount || 0)
    }
    if (showLoadingScreen) setIsLoading(false)
  }

  const handleSaveClinic = async (data: any) => {
    setIsSaving(true)
    const result = selectedClinic
      ? await updateClinic(selectedClinic.id, data)
      : await addClinic(data)
    if (result.success) {
      handleCloseModal()
      await loadClinics(false)
    } else {
      alert(`Error ${selectedClinic ? 'updating' : 'adding'} clinic: ` + result.error)
    }
    setIsSaving(false)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedClinic(null)
  }

  const handleEdit = (clinic: ClinicData) => {
    setSelectedClinic(clinic)
    setIsModalOpen(true)
  }

  return (
    <div className="p-8">
      <ClinicHeader onAddClick={() => {
        setSelectedClinic(null)
        setIsModalOpen(true)
      }} />

      <ClinicFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={(status) => setStatusFilter(String(status))}
      />

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Loading clinics...</p>
        </div>
      ) : (
        <ClinicTable
          clinics={clinics}
          onRefresh={() => loadClinics(false)}
          onEdit={handleEdit}
          currentPage={currentPage}
          totalCount={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}

      <ClinicFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveClinic}
        isSaving={isSaving}
        initialData={selectedClinic}
      />
    </div>
  )
}