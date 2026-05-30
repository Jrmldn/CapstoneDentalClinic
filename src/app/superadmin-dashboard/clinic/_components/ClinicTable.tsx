'use client'

import { Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { deleteClinic, updateClinicStatus } from '@/app/actions/clinicActions'

interface Clinic {
  id: number
  name: string
  is_active: boolean
  email: string
  phone: string
  address: string
  max_appointments_per_day: number
}

interface ClinicTableProps {
  clinics: Clinic[]
  onRefresh?: () => void
  onEdit?: (clinic: Clinic) => void 
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function ClinicTable({ 
  clinics, 
  onRefresh, 
  onEdit,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange
}: ClinicTableProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  
  // NEW: State to track selected row IDs
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
        <CheckCircle2 className="w-3 h-3" />
        Active
      </div>
    ) : (
      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
        <AlertCircle className="w-3 h-3" />
        Inactive
      </div>
    )
  }

  // NEW: Handle checking/unchecking a single row
  const toggleRowSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id) // Uncheck
        : [...prev, id] // Check
    )
  }

  // NEW: Handle the master "Select All" checkbox in the header
  const toggleSelectAll = () => {
    // Check if every currently visible clinic is already selected
    const allVisibleSelected = clinics.length > 0 && clinics.every(c => selectedIds.includes(c.id))
    
    if (allVisibleSelected) {
      // If all are selected, unselect the currently visible ones
      const visibleIds = clinics.map(c => c.id)
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      // If not all are selected, select all visible ones (without duplicating IDs)
      const newIds = clinics.map(c => c.id).filter(id => !selectedIds.includes(id))
      setSelectedIds(prev => [...prev, ...newIds])
    }
  }

  const handleDelete = async (clinicId: number) => {
    if (confirm('Are you sure you want to delete this clinic?')) {
      setIsDeleting(clinicId)
      const result = await deleteClinic(clinicId)
      if (result.success) {
        // Remove the deleted ID from selection if it was checked
        setSelectedIds(prev => prev.filter(id => id !== clinicId))
        onRefresh?.()
      } else {
        alert('Error deleting clinic: ' + result.error)
      }
      setIsDeleting(null)
    }
  }

  const handleToggleStatus = async (clinic: Clinic) => {
    const result = await updateClinicStatus(clinic.id, !clinic.is_active)
    if (result.success) {
      onRefresh?.()
    } else {
      alert('Error updating clinic status: ' + result.error)
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  if (clinics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No clinics found. Add a new clinic to get started.</p>
      </div>
    )
  }

  // NEW: Determine if the header checkbox should be checked
  const isAllVisibleSelected = clinics.length > 0 && clinics.every(c => selectedIds.includes(c.id))

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left w-12">
                {/* Master Checkbox */}
                <input 
                  type="checkbox" 
                  className="rounded cursor-pointer w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
                  checked={isAllVisibleSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">CLINIC NAME</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">STATUS</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">EMAIL</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PHONE NUMBER</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ADDRESS</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">CAPACITY</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clinics.map((clinic) => {
              const isSelected = selectedIds.includes(clinic.id)
              
              return (
                <tr 
                  key={clinic.id} 
                  // Add a subtle background color if the row is selected
                  className={`transition ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-6 py-4">
                    {/* Individual Row Checkbox */}
                    <input 
                      type="checkbox" 
                      className="rounded cursor-pointer w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      checked={isSelected}
                      onChange={() => toggleRowSelection(clinic.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{clinic.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleToggleStatus(clinic)} className="hover:opacity-70 transition">
                      {getStatusBadge(clinic.is_active)}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{clinic.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{clinic.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-[200px]">{clinic.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{clinic.max_appointments_per_day}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit?.(clinic)}
                        disabled={isDeleting === clinic.id}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(clinic.id)}
                        disabled={isDeleting === clinic.id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                      >
                        {isDeleting === clinic.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Restored Simple Pagination Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>Showing {clinics.length} of {totalCount}</span>
          {/* Optional: Show how many are currently selected */}
          {selectedIds.length > 0 && (
            <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
              {selectedIds.length} selected
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
          >
            &lt;
          </button>
          
          {pageNumbers.map((page) => (
            <button 
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-2 py-1 hover:bg-gray-200 rounded transition ${
                currentPage === page ? 'text-blue-600 font-medium' : ''
              }`}
            >
              {page}
            </button>
          ))}

          <button 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  )
}