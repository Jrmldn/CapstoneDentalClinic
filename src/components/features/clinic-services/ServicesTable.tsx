'use client'

import React from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { ServicesTableProps } from '@/components/features/clinic-services/types'
import { useServices } from '@/components/features/clinic-services/useServices'
import ServiceForm from '@/components/features/clinic-services/ServiceForm'



/**
 * ServicesTable Component
 * Refactored to act as a presentational UI shell.
 * Business logic and state management are delegated to the useServices hook.
 * The inline form is delegated to the ServiceForm component.
 */
export default function ServicesTable({ clinicId, initialServices }: ServicesTableProps) {
  const {
    services,
    showForm,
    editingId,
    form,
    msg,
    isPending,
    handleChange,
    openAdd,
    openEdit,
    handleCancel,
    handleSubmit,
    handleDelete,
  } = useServices({ clinicId, initialServices })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{services.length} active service{services.length !== 1 ? 's' : ''}</p>
        <button
          id="add-service-btn"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <ServiceForm
          editingId={editingId}
          form={form}
          isPending={isPending}
          msg={msg}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
        />
      )}

      {/* Global error outside form */}
      {msg && !showForm && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Table */}
      {services.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No services yet. Click &quot;Add Service&quot; to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Service Name</th>
                <th className="px-5 py-3 text-left font-medium">Price</th>
                <th className="px-5 py-3 text-left font-medium">Duration</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {services.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-700">{s.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">₱{Number(s.price).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-gray-500">{s.slot_duration_min} min</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                        title="Archive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
