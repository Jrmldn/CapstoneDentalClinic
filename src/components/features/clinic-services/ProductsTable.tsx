'use client'

import React from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { ProductsTableProps } from '@/components/features/clinic-services/types'
import { useProducts } from '@/components/features/clinic-services/useProducts'
import ProductForm from '@/components/features/clinic-services/ProductForm'



/**
 * ProductsTable Component
 * Refactored to act as a presentational UI shell.
 * Business logic and state management are delegated to the useProducts hook.
 * The inline form is delegated to the ProductForm component.
 */
export default function ProductsTable({ clinicId, initialProducts }: ProductsTableProps) {
  const {
    products,
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
  } = useProducts({ clinicId, initialProducts })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{products.length} active product{products.length !== 1 ? 's' : ''}</p>
        <button
          id="add-product-btn"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <ProductForm
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
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No products yet. Click &quot;Add Product&quot; to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Product Name</th>
                <th className="px-5 py-3 text-left font-medium">Price</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-700">{p.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">₱{Number(p.price).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
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
