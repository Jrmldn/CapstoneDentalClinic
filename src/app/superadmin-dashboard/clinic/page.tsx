'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import ClinicHeader from '@/components/features/clinic/ClinicHeader'
import ClinicTable from '@/components/features/clinic/ClinicTable'
import ClinicFormModal from '@/components/features/clinic/ClinicFormModal'
import ClinicFilterBar from '@/components/features/clinic/ClinicFilterBar'
import DisableClinicModal from '@/components/features/clinic/DisableClinicModal'
import EnableClinicModal from '@/components/features/clinic/EnableClinicModal'
import { addClinic, fetchClinics } from '@/actions/clinicActions'
import { AddClinicData, Clinic } from '@/types/clinic'

const ITEMS_PER_PAGE = 10

export default function ClientClinicPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [inactiveCount, setInactiveCount] = useState(0)

  const [disableTarget, setDisableTarget] = useState<Clinic | null>(null)
  const [enableTarget, setEnableTarget] = useState<Clinic | null>(null)

  const isFirstRender = useRef(true)

  const loadClinics = useCallback(async (showLoadingScreen = true) => {
    if (showLoadingScreen) setIsLoading(true)
    try {
      const result = await fetchClinics(searchQuery, statusFilter, currentPage, ITEMS_PER_PAGE)
      if (result.success) {
        setClinics(result.clinics)
        setTotalCount(result.totalCount || 0)
        setActiveCount(result.activeCount || 0)
        setInactiveCount(result.inactiveCount || 0)
      } else {
        console.error('Failed to fetch clinics:', result.error)
      }
    } catch (err) {
      console.error('Unexpected error loading clinics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter, currentPage])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClinics(false)
      isFirstRender.current = false
    }, 0)
    return () => clearTimeout(timer)
  }, [loadClinics])

  useEffect(() => {
    if (isFirstRender.current) return
    loadClinics(false)
  }, [currentPage, loadClinics])

  useEffect(() => {
    if (isFirstRender.current) return
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1)
      loadClinics(false)
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, statusFilter, loadClinics])

  const handleSaveClinic = async (data: AddClinicData) => {
    setIsSaving(true)
    try {
      const result = await addClinic(data)
      if (result.success) {
        setIsModalOpen(false)
        await loadClinics(false)
      } else {
        console.error('Error adding clinic:', result.error)
      }
    } catch (err) {
      console.error('Error saving clinic:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8">
      <ClinicHeader onAddClick={() => setIsModalOpen(true)} />

      <ClinicFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={(status) => setStatusFilter(String(status))}
      />

      <p className="text-sm text-gray-500 mb-3">
        Showing {totalCount} clinics ({activeCount} Active · {inactiveCount} Inactive)
      </p>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Loading clinics...</p>
        </div>
      ) : (
        <ClinicTable
          clinics={clinics}
          onRefresh={() => loadClinics(false)}
          onDisable={(c) => setDisableTarget(c)}
          onEnable={(c) => setEnableTarget(c)}
          currentPage={currentPage}
          totalCount={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}

      <ClinicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveClinic}
        isSaving={isSaving}
        initialData={null}
      />

      <DisableClinicModal
        clinic={disableTarget}
        onClose={() => setDisableTarget(null)}
        onSuccess={() => loadClinics(false)}
      />

      <EnableClinicModal
        clinic={enableTarget}
        onClose={() => setEnableTarget(null)}
        onSuccess={() => loadClinics(false)}
      />
    </div>
  )
}
