'use client'

import { useState, useEffect } from 'react'
import PersonnelTabs from './_components/PersonnelTabs'
import StaffTable, { StaffMember } from './_components/StaffTable'
import DentistTable, { Dentist } from './_components/DentistTable'
import AddPersonnelModal from './_components/AddPersonnelModal'
import EditPersonnelModal from './_components/EditPersonnelModal' 
import { Plus, Search, Filter } from 'lucide-react'
import { fetchPersonnel } from '@/app/actions/personnelActions'

export default function PersonnelPage() {
  const [activeTab, setActiveTab] = useState<'staff' | 'dentists'>('staff')
  const [staffData, setStaffData] = useState<StaffMember[]>([])
  const [dentistData, setDentistData] = useState<Dentist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    const result = await fetchPersonnel()
    
    if (result.success) {
      setStaffData(result.staff || [])
      setDentistData(result.dentists || [])
    } else {
      console.error(result.error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

// AFTER
  const handleRefresh = async () => {
    await loadData()
  }

  const handleEdit = (person: any) => {
    setSelectedPerson(person)
    setIsEditModalOpen(true)
  }

  // REFACTORED: This ensures the modal state is completely wiped
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedPerson(null) 
  }

  return (
    <div className="p-8 w-full">
      {/* 1. Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Personnel</h1>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add a new {activeTab === 'staff' ? 'Staff' : 'Dentist'}
        </button>
      </div>

      {/* 2. The Tab Navigation */}
      <div className="mb-6">
        <PersonnelTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab} by name or email...`}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition"
          />
        </div>
        <div className="w-48">
          <button className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 shadow-sm transition">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span>All Clinics</span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
        </div>
      </div>

      {/* 4. Render Tables */}
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : activeTab === 'staff' ? (
          <StaffTable 
            staff={staffData} 
            onRefresh={handleRefresh} 
            onEdit={handleEdit} 
          />
        ) : (
          <DentistTable 
            dentists={dentistData} 
            onRefresh={handleRefresh}
            onEdit={handleEdit}
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