'use client'

import React from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { ProductsTableProps, Product } from './types'
import { useProducts } from './useProducts'
import ProductForm from './ProductForm'

function displayPrice(p: Product) {
  if (p.price_min != null && p.price_max != null && p.price_min !== p.price_max) {
    return `₱${Number(p.price_min).toLocaleString()} – ₱${Number(p.price_max).toLocaleString()}`
  }
  return `₱${Number(p.price).toLocaleString()}`
}

export default function ProductsTable({ clinicId, initialProducts, viewerRole, allClinicIds }: ProductsTableProps) {
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
  } = useProducts({ clinicId, initialProducts, allClinicIds })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{products.length} active product{products.length !== 1 ? 's' : ''}</p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {showForm && (
        <ProductForm
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
                  <td className="px-5 py-3.5 text-gray-600">{displayPrice(p)}</td>
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
