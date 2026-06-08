'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import PersonnelTabs from '@/components/features/personnel/PersonnelTabs'
import StaffTable from '@/components/features/personnel/StaffTable'
import DentistTable from '@/components/features/personnel/DentistTable'
import AddPersonnelModal from '@/components/features/personnel/AddPersonnelModal'
import EditPersonnelModal from '@/components/features/personnel/EditPersonnelModal'

import { Plus } from 'lucide-react'
import PersonnelFilterBar from '@/components/features/personnel/PersonnelFilterBar'
import { fetchStaff, fetchDentists } from '@/actions/personnelActions' // FIX: Removed unused fetchPersonnel
import { getClinics } from '@/lib/queries/clinics'
import { FormattedStaff, FormattedDentist } from '@/types/clinic'


const ITEMS_PER_PAGE = 10

export default function PersonnelPage() {
  const [activeTab, setActiveTab] = useState<'staff' | 'dentists'>('staff')
  const [staffData, setStaffData] = useState<FormattedStaff[]>([])
  const [dentistData, setDentistData] = useState<FormattedDentist[]>([])
  const [clinics, setClinics] = useState<{ id: number; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [clinicFilter, setClinicFilter] = useState('all')

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<FormattedStaff | FormattedDentist | null>(null)

  // Ref to track if it's the first time the component is rendering
  const isFirstRender = useRef(true)

  const loadClinics = useCallback(async () => { // FIX: Wrapped in useCallback
    const result = await getClinics()
    if (result.success) {
      setClinics(result.data || [])
    }
  }, [])

  const loadPersonnelData = useCallback(
    async (showLoadingScreen = true) => {
      if (showLoadingScreen) setIsLoading(true)

      try {
        if (activeTab === 'staff') {
          const result = await fetchStaff(searchQuery, clinicFilter, currentPage, ITEMS_PER_PAGE)
          if (result.success) {
            setStaffData(result.staff)
            setTotalCount(result.totalCount || 0)
          } else {
            console.error('Failed to fetch staff:', result.error)
            alert('Failed to load staff: ' + result.error)
          }
        } else {
          const result = await fetchDentists(searchQuery, clinicFilter, currentPage, ITEMS_PER_PAGE)
          if (result.success) {
            setDentistData(result.dentists)
            setTotalCount(result.totalCount || 0)
          } else {
            console.error('Failed to fetch dentists:', result.error)
            alert('Failed to load dentists: ' + result.error)
          }
        }
      } catch (err) {
        console.error('Unexpected error loading personnel:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [searchQuery, clinicFilter, activeTab, currentPage]
  )

  // Initial page load - fetch clinics and load personnel
  useEffect(() => {
    // FIX: Deferring calls to avoid synchronous setState warning in effect body
    const timer = setTimeout(() => {
      loadClinics()
      loadPersonnelData(false)
      isFirstRender.current = false
    }, 0)
    return () => clearTimeout(timer)
  }, [loadClinics, loadPersonnelData]) // FIX: Added dependencies

  // Refetch data whenever the page number changes
  useEffect(() => {
    if (isFirstRender.current) return
    loadPersonnelData(false)
  }, [currentPage, loadPersonnelData]) // FIX: Added dependencies

  // Debounced effect for Search & Filter
  useEffect(() => {
    if (isFirstRender.current) return

    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1) // Always jump back to page 1 when searching
      loadPersonnelData(false)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, clinicFilter, activeTab, loadPersonnelData]) // FIX: Added dependencies

  const handleRefresh = useCallback(async () => { // FIX: Wrapped in useCallback
    await loadPersonnelData(false)
  }, [loadPersonnelData])

  const handleEdit = (person: FormattedStaff | FormattedDentist) => {
    setSelectedPerson(person)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedPerson(null)
  }

  return (
    <div className="p-8 w-full">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Personnel</h1>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg hover:shadow-lg transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add a new {activeTab === 'staff' ? 'Staff' : 'Dentist'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <PersonnelTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Filters */}
      <PersonnelFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        clinicFilter={clinicFilter}
        onClinicChange={(clinicId) => setClinicFilter(String(clinicId))}
        clinics={clinics}
      />

      {/* Render Tables with Pagination */}
      <div>
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Loading {activeTab}...</p>
          </div>
        ) : activeTab === 'staff' ? (
          <StaffTable
            staff={staffData}
            onRefresh={handleRefresh}
            onEdit={handleEdit}
            currentPage={currentPage}
            totalCount={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        ) : (
          <DentistTable
            dentists={dentistData}
            onRefresh={handleRefresh}
            onEdit={handleEdit}
            currentPage={currentPage}
            totalCount={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Add Modal */}
      <AddPersonnelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleRefresh}
        type={activeTab}
      />

      {/* Edit Modal */}
      <EditPersonnelModal
        key={selectedPerson?.userId || 'none'}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleRefresh}
        person={selectedPerson}
        type={activeTab}
      />
    </div>
  )
}