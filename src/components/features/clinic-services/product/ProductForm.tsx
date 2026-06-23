import React from 'react'
import { Loader2, Check, X } from 'lucide-react'

interface ProductFormProps {
  viewerRole: 'superadmin' | 'staff'
  editingId: number | null
  form: {
    name: string
    price: string
    addToAllBranches: boolean
  }
  isPending: boolean
  msg: { type: 'success' | 'error'; text: string } | null
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  handleCancel: () => void
  showAllBranchesOption?: boolean
}

export default function ProductForm({
  viewerRole,
  editingId,
  form,
  isPending,
  msg,
  handleChange,
  handleSubmit,
  handleCancel,
  showAllBranchesOption = false,
}: ProductFormProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 p-4 rounded-xl border border-blue-100 bg-blue-50 space-y-3"
    >
      <p className="text-sm font-semibold text-slate-700">
        {editingId ? 'Edit Product' : 'New Product'}
      </p>

      {/* Product name */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="e.g. Dental Floss"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Price */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Price (₱)</label>
        <input
          name="price"
          type="number"
          min="0"
          step="10"
          value={form.price}
          onChange={handleChange}
          required
          placeholder="0"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Add to all branches (superadmin add only) */}
      {viewerRole === 'superadmin' && !editingId && showAllBranchesOption && (
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            name="addToAllBranches"
            checked={form.addToAllBranches}
            onChange={handleChange}
            className="w-4 h-4 accent-blue-600"
          />
          Add to all branches
        </label>
      )}

      {msg && (
        <p className={`text-xs font-medium ${msg.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {msg.text}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {editingId ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </form>
  )
}
