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
}

export default function ClinicTable({ clinics, onRefresh }: ClinicTableProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

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

  const handleDelete = async (clinicId: number) => {
    if (confirm('Are you sure you want to delete this clinic?')) {
      setIsDeleting(clinicId)
      const result = await deleteClinic(clinicId)
      if (result.success) {
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

  if (clinics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No clinics found. Add a new clinic to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                CLINIC NAME
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                STATUS
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                EMAIL
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                PHONE NUMBER
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ADDRESS
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                CAPACITY
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clinics.map((clinic) => (
              <tr key={clinic.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <input type="checkbox" className="rounded" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {clinic.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(clinic)}
                    className="hover:opacity-70 transition"
                  >
                    {getStatusBadge(clinic.is_active)}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {clinic.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {clinic.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {clinic.address}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {clinic.max_appointments_per_day}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-sm text-gray-600">
        <span>Showing {clinics.length} of {clinics.length}</span>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50" disabled>&lt;</button>
          <button className="px-2 py-1 hover:bg-gray-200 rounded transition">1</button>
          <button className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50" disabled>&gt;</button>
        </div>
      </div>
    </div>
  )
}
