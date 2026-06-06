'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import ClinicHeader from '@/components/features/clinic/ClinicHeader'
import ClinicTable from '@/components/features/clinic/ClinicTable'
import ClinicFormModal from '@/components/features/clinic/ClinicFormModal'

import ClinicFilterBar from '@/components/features/clinic/ClinicFilterBar'
import { addClinic, updateClinic, fetchClinics } from '@/actions/clinicActions'
import { AddClinicData, Clinic } from '@/types/clinic'


const ITEMS_PER_PAGE = 10

export default function ClientClinicPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const isFirstRender = useRef(true)

  const loadClinics = useCallback(async (showLoadingScreen = true) => { // FIX: Wrapped in useCallback
    if (showLoadingScreen) setIsLoading(true)
    try {
      const result = await fetchClinics(searchQuery, statusFilter, currentPage, ITEMS_PER_PAGE)
      if (result.success) {
        setClinics(result.clinics)
        setTotalCount(result.totalCount || 0)
      } else {
        console.error('Failed to fetch clinics:', result.error)
        alert('Failed to load clinics: ' + result.error)
      }
    } catch (err) {
      console.error('Unexpected error loading clinics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter, currentPage]) // FIX: Added dependencies

  useEffect(() => {
    // FIX: Deferring call to avoid synchronous setState warning in effect body
    const timer = setTimeout(() => {
      loadClinics(false)
      isFirstRender.current = false
    }, 0)
    return () => clearTimeout(timer)
  }, [loadClinics]) // FIX: Added loadClinics dependency

  useEffect(() => {
    if (isFirstRender.current) return
    loadClinics(false)
  }, [currentPage, loadClinics]) // FIX: Added loadClinics dependency

  useEffect(() => {
    if (isFirstRender.current) return
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1)
      loadClinics(false)
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, statusFilter, loadClinics]) // FIX: Added loadClinics dependency

  const handleSaveClinic = async (data: AddClinicData) => { // FIX: Replaced any
    setIsSaving(true)
    try {
      const result = selectedClinic
        ? await updateClinic(selectedClinic.id, data)
        : await addClinic(data)
      if (result.success) {
        handleCloseModal()
        await loadClinics(false)
      } else {
        alert(`Error ${selectedClinic ? 'updating' : 'adding'} clinic: ` + result.error)
      }
    } catch (err) {
      console.error('Error saving clinic:', err)
      alert('An unexpected error occurred while saving.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedClinic(null)
  }

  const handleEdit = (clinic: Clinic) => {
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
        key={selectedClinic?.id || 'new'} // FIX: Reset state by changing key
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveClinic}
        isSaving={isSaving}
        initialData={selectedClinic}
      />
    </div>
  )
}