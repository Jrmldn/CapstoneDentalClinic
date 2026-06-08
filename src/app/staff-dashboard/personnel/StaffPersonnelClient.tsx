'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import PersonnelTabs from '@/components/features/personnel/PersonnelTabs'
import StaffTable from '@/components/features/personnel/StaffTable'
import DentistTable from '@/components/features/personnel/DentistTable'
import AddPersonnelModal from '@/components/features/personnel/AddPersonnelModal'
import EditPersonnelModal from '@/components/features/personnel/EditPersonnelModal'
import { fetchStaff, fetchDentists } from '@/actions/personnelActions'
import { FormattedStaff, FormattedDentist } from '@/types/clinic'

const ITEMS_PER_PAGE = 10

interface StaffPersonnelClientProps {
  clinicId: number
}

export default function StaffPersonnelClient({ clinicId }: StaffPersonnelClientProps) {
  const [activeTab, setActiveTab] = useState<'staff' | 'dentists'>('staff')
  const [staffData, setStaffData] = useState<FormattedStaff[]>([])
  const [dentistData, setDentistData] = useState<FormattedDentist[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<FormattedStaff | FormattedDentist | null>(null)

  // Ref to track if it's the first time the component is rendering
  const isFirstRender = useRef(true)

  const loadPersonnelData = useCallback(
    async (showLoadingScreen = true) => {
      if (showLoadingScreen) setIsLoading(true)

      try {
        if (activeTab === 'staff') {
          const result = await fetchStaff(searchQuery, clinicId.toString(), currentPage, ITEMS_PER_PAGE)
          if (result.success) {
            setStaffData(result.staff)
            setTotalCount(result.totalCount || 0)
          } else {
            console.error('Failed to fetch staff:', result.error)
          }
        } else {
          const result = await fetchDentists(searchQuery, clinicId.toString(), currentPage, ITEMS_PER_PAGE)
          if (result.success) {
            setDentistData(result.dentists)
            setTotalCount(result.totalCount || 0)
          } else {
            console.error('Failed to fetch dentists:', result.error)
          }
        }
      } catch (err) {
        console.error('Unexpected error loading personnel:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [searchQuery, clinicId, activeTab, currentPage]
  )

  // Initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPersonnelData(false)
      isFirstRender.current = false
    }, 0)
    return () => clearTimeout(timer)
  }, [loadPersonnelData])

  // Refetch data whenever the page changes
  useEffect(() => {
    if (isFirstRender.current) return
    loadPersonnelData(false)
  }, [currentPage, loadPersonnelData])

  // Debounced search effect
  useEffect(() => {
    if (isFirstRender.current) return

    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1)
      loadPersonnelData(false)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, activeTab, loadPersonnelData])

  const handleRefresh = useCallback(async () => {
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
    <div className="w-full text-slate-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personnel Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage staff members and dentists registered at your clinic.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition font-semibold text-sm shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add a new {activeTab === 'staff' ? 'Staff' : 'Dentist'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <PersonnelTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Filter Bar (Custom Search input) */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab} by name...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-55 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
          />
        </div>
      </div>

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

      {/* Add Personnel Modal */}
      <AddPersonnelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleRefresh}
        type={activeTab}
        fixedClinicId={clinicId}
      />

      {/* Edit Personnel Modal */}
      <EditPersonnelModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleRefresh}
        person={selectedPerson}
        type={activeTab}
        fixedClinicId={clinicId}
      />
    </div>
  )
}
