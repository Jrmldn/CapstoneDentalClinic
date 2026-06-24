import React from 'react'
import { Loader2, Check, X } from 'lucide-react'

interface ServiceFormProps {
  editingId: number | null
  form: {
    name: string
    price: string
    slot_duration_min: string
  }
  isPending: boolean
  msg: { type: 'success' | 'error'; text: string } | null
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  handleCancel: () => void
}

/**
 * ServiceForm Component
 * Renders the form for creating or editing services.
 */
export default function ServiceForm({
  editingId,
  form,
  isPending,
  msg,
  handleChange,
  handleSubmit,
  handleCancel,
}: ServiceFormProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 p-4 rounded-xl border border-blue-100 bg-blue-50 space-y-3"
    >
      <p className="text-sm font-semibold text-slate-700">
        {editingId ? 'Edit Service' : 'New Service'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Service Name</label>
          <input
            id="service-name-input"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. Tooth Extraction"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Price (₱)</label>
          <input
            id="service-price-input"
            name="price"
            type="number"
            min="0"
            step="50"
            value={form.price}
            onChange={handleChange}
            required
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
          <input
            id="service-duration-input"
            name="slot_duration_min"
            type="number"
            min="5"
            step="5"
            value={form.slot_duration_min}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

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
