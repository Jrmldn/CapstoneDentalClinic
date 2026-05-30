'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ClinicHeader from './_components/ClinicHeader'
import ClinicFilters from './_components/ClinicFilters'
import ClinicTable from './_components/ClinicTable'
import ClinicFormModal from './_components/ClinicFormModal'
import { addClinic, updateClinic, fetchClinics } from '@/app/actions/clinicActions'

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

const ITEMS_PER_PAGE = 10

export default function ClientClinicPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<ClinicData | null>(null)
  const [clinics, setClinics] = useState<ClinicData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Ref to track if it's the first time the component is rendering
  const isFirstRender = useRef(true)

  // Initial page load
  useEffect(() => {
    loadClinics(true)
    isFirstRender.current = false
  }, [])

  // Refetch data whenever the page number changes
  useEffect(() => {
    if (isFirstRender.current) return
    loadClinics(false) 
  }, [currentPage])

  // Debounced effect for Search & Filter
  useEffect(() => {
    if (isFirstRender.current) return

    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1) // Always jump back to page 1 when searching
      loadClinics(false) // Trigger a silent refresh
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, statusFilter])

  // Pass pagination state to the server action
  const loadClinics = async (showLoadingScreen = true) => {
    if (showLoadingScreen) setIsLoading(true)
    
    // Pass the search, filter, and pagination states to Supabase
    const result = await fetchClinics(searchQuery, statusFilter, currentPage, ITEMS_PER_PAGE)
    
    if (result.success) {
      setClinics(result.clinics)
      setTotalCount(result.totalCount || 0) // Save the total count for the table
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
      {/* Header */}
      <ClinicHeader onAddClick={() => {
        setSelectedClinic(null) 
        setIsModalOpen(true)
      }} />

      {/* Filters */}
      <ClinicFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Table Updated with Pagination Props */}
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

      {/* Modal */}
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