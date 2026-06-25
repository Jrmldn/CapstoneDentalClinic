'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, X } from 'lucide-react'

import PersonnelFilterBar from '@/components/features/personnel/PersonnelFilterBar'
import UnifiedPersonnelTable from '@/components/features/personnel/UnifiedPersonnelTable'
import AddPersonnelModal from '@/components/features/personnel/AddPersonnelModal'
import EditPersonnelModal from '@/components/features/personnel/EditPersonnelModal'
import DisableAccountModal from '@/components/features/personnel/DisableAccountModal'
import EnableAccountModal from '@/components/features/personnel/EnableAccountModal'

import { fetchPersonnel, disableUserAccount, enableUserAccount } from '@/actions/personnelActions'
import { getClinics } from '@/lib/queries/clinics'
import { UnifiedPersonnel } from '@/types/clinic'

const ITEMS_PER_PAGE = 20

export default function PersonnelPage() {
  const [allPersonnel, setAllPersonnel] = useState<UnifiedPersonnel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [clinics, setClinics] = useState<{ id: number; name: string }[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [clinicFilter, setClinicFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<UnifiedPersonnel | null>(null)
  const [editType, setEditType] = useState<'staff' | 'dentist'>('staff')

  // Disable/Enable
  const [disableTarget, setDisableTarget] = useState<UnifiedPersonnel | null>(null)
  const [enableTarget, setEnableTarget] = useState<UnifiedPersonnel | null>(null)
  const [isDisablingSubmit, setIsDisablingSubmit] = useState(false)
  const [isEnablingSubmit, setIsEnablingSubmit] = useState(false)

  // Feedback
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [personnelResult, clinicsResult] = await Promise.all([
        fetchPersonnel(),
        getClinics(),
      ])

      if (clinicsResult.success) setClinics(clinicsResult.data || [])

      if (personnelResult.success && personnelResult.staff && personnelResult.dentists) {
        const merged: UnifiedPersonnel[] = [
          ...personnelResult.staff.map(s => ({ ...s, role: 'staff' as const })),
          ...personnelResult.dentists.map(d => ({ ...d, role: 'dentist' as const })),
        ]
        merged.sort((a, b) =>
          a.clinicName.localeCompare(b.clinicName) ||
          (a.role === b.role ? 0 : a.role === 'staff' ? -1 : 1) ||
          (Number(a.isDisabled) - Number(b.isDisabled))
        )
        setAllPersonnel(merged)
      }
    } catch (err) {
      console.error('Unexpected error loading personnel:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, clinicFilter, roleFilter, statusFilter])

  const handleRefresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  const filteredPersonnel = useMemo(() => {
    return allPersonnel.filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase()
      const matchesSearch = !searchQuery ||
        fullName.includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClinic = clinicFilter === 'all' || p.clinicId === parseInt(clinicFilter)
      const matchesRole = roleFilter === 'all' || p.role === roleFilter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' ? !p.isDisabled : p.isDisabled)
      return matchesSearch && matchesClinic && matchesRole && matchesStatus
    })
  }, [allPersonnel, searchQuery, clinicFilter, roleFilter, statusFilter])

  const pageData = filteredPersonnel.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleEdit = (person: UnifiedPersonnel) => {
    setSelectedPerson(person)
    setEditType(person.role)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedPerson(null)
  }

  const handleDisableRequest = (person: UnifiedPersonnel) => setDisableTarget(person)

  const handleConfirmDisable = async () => {
    if (!disableTarget) return
    setIsDisablingSubmit(true)
    const res = await disableUserAccount(disableTarget.userId)
    setIsDisablingSubmit(false)
    if (res.success) {
      setDisableTarget(null)
      await handleRefresh()
      setActionMessage({ type: 'success', text: 'Account disabled successfully.' })
    } else {
      setActionMessage({ type: 'error', text: res.error ?? 'Failed to disable account.' })
    }
  }

  const handleEnableRequest = (person: UnifiedPersonnel) => setEnableTarget(person)

  const handleConfirmEnable = async () => {
    if (!enableTarget) return
    setIsEnablingSubmit(true)
    const res = await enableUserAccount(enableTarget.userId)
    setIsEnablingSubmit(false)
    if (res.success) {
      setEnableTarget(null)
      await handleRefresh()
      setActionMessage({ type: 'success', text: 'Account enabled successfully.' })
    } else {
      setActionMessage({ type: 'error', text: res.error ?? 'Failed to enable account.' })
    }
  }

  return (
    <div className="p-8 w-full">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personnel</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage clinic staff and dentists across all branches.
            Add, edit, disable, or re-enable personnel accounts.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg hover:shadow-lg transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Personnel
        </button>
      </div>

      {actionMessage && (
        <div className={`mb-4 flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="ml-4 text-current opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <PersonnelFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        clinicFilter={clinicFilter}
        onClinicChange={(v) => setClinicFilter(String(v))}
        clinics={clinics}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Loading personnel...</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">
            Showing {filteredPersonnel.length} personnel (
            {filteredPersonnel.filter(p => p.role === 'staff').length} Staff ·{' '}
            {filteredPersonnel.filter(p => p.role === 'dentist').length} Dentists
            )
          </p>
          <UnifiedPersonnelTable
            data={pageData}
            onEdit={handleEdit}
            onDisable={handleDisableRequest}
            onEnable={handleEnableRequest}
            onRefresh={handleRefresh}
            currentPage={currentPage}
            totalCount={filteredPersonnel.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <AddPersonnelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <EditPersonnelModal
        key={selectedPerson?.userId || 'none'}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleRefresh}
        person={selectedPerson}
        type={editType}
        clinics={clinics}
      />

      <DisableAccountModal
        isOpen={!!disableTarget}
        onClose={() => setDisableTarget(null)}
        onConfirm={handleConfirmDisable}
        person={disableTarget}
        isSubmitting={isDisablingSubmit}
      />

      <EnableAccountModal
        isOpen={!!enableTarget}
        onClose={() => setEnableTarget(null)}
        onConfirm={handleConfirmEnable}
        person={enableTarget}
        isSubmitting={isEnablingSubmit}
      />
    </div>
  )
}
