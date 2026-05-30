'use client'

import { Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deletePersonnel } from '@/app/actions/personnelActions'

export interface StaffMember {
  id: number
  userId: string
  firstName: string
  lastName: string
  email: string
  clinicName: string
}

interface StaffTableProps {
  staff: StaffMember[]
  onRefresh?: () => void
  onEdit: (staff: StaffMember) => void // <--- ADDED THIS
}

export default function StaffTable({ staff, onRefresh, onEdit }: StaffTableProps) { // <--- ADDED onEdit HERE
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      setIsDeleting(userId)
      const result = await deletePersonnel(userId)
      if (result.success) {
        onRefresh?.()
      } else {
        alert('Error deleting staff: ' + result.error)
      }
      setIsDeleting(null)
    }
  }

  if (staff.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500 shadow-sm">
        No staff members found. Add one to get started.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#f8f9fa] text-[11px] uppercase tracking-wider font-semibold text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 w-12">
                <input type="checkbox" className="rounded border-gray-300 text-slate-900 focus:ring-slate-900" />
              </th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Clinic</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-600">
            {staff.map((person) => (
              <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <input type="checkbox" className="rounded border-gray-300 text-slate-900 focus:ring-slate-900" />
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {person.firstName} {person.lastName}
                </td>
                <td className="px-6 py-4">{person.email}</td>
                <td className="px-6 py-4">{person.clinicName}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-4">
                    <button 
                      onClick={() => onEdit(person)} // <--- ADDED THIS CLICK HANDLER
                      className="text-blue-500 hover:text-blue-700 transition" 
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(person.userId)}
                      disabled={isDeleting === person.userId}
                      className="text-red-500 hover:text-red-700 transition disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting === person.userId ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
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
      
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white">
        <span>Showing {staff.length} of {staff.length}</span>
      </div>
    </div>
  )
}