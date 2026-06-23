'use client'

import React from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { ServicesTableProps, Service } from './types'
import { useServices } from './useServices'
import ServiceForm from './ServiceForm'

function displayPrice(s: Service) {
  if (s.price_min != null && s.price_max != null && s.price_min !== s.price_max) {
    return `₱${Number(s.price_min).toLocaleString()} – ₱${Number(s.price_max).toLocaleString()}`
  }
  return `₱${Number(s.price).toLocaleString()}`
}

export default function ServicesTable({ clinicId, initialServices, viewerRole, allClinicIds }: ServicesTableProps) {
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
  } = useServices({ clinicId, initialServices, allClinicIds })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{services.length} active service{services.length !== 1 ? 's' : ''}</p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {showForm && (
        <ServiceForm
          viewerRole={viewerRole}
          editingId={editingId}
          form={form}
          isPending={isPending}
          msg={msg}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
          showAllBranchesOption={!!allClinicIds && allClinicIds.length > 1}
        />
      )}

      {msg && !showForm && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

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
                  <td className="px-5 py-3.5 font-medium text-slate-700">
                    {s.name}
                    {s.allows_installment && (
                      <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded uppercase">
                        Installments
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{displayPrice(s)}</td>
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
