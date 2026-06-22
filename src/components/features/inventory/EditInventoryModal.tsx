'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { editInventoryItem } from '@/actions/inventoryActions'
import type { InventoryItem, InventoryCategory } from './types'

interface EditInventoryModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  categories: InventoryCategory[]
}

export default function EditInventoryModal({ item, isOpen, onClose, onSuccess, categories }: EditInventoryModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    alert_threshold: '',
    category_id: '',
    expiry_date: '',
  })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        unit: item.unit,
        alert_threshold: String(item.alert_threshold),
        category_id: item.category_id ? String(item.category_id) : '',
        expiry_date: item.expiry_date ?? '',
      })
      setError('')
    }
  }, [item])

  if (!mounted || !isOpen || !item) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const result = await editInventoryItem(item.id, {
      name: formData.name,
      unit: formData.unit,
      alert_threshold: parseFloat(formData.alert_threshold),
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      expiry_date: formData.expiry_date || null,
    })

    if (result.success) {
      onSuccess()
      onClose()
    } else {
      setError(result.error || 'Failed to update item')
    }
    setIsSubmitting(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900">Edit Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-900 transition p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium">{error}</div>}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Item Name</label>
            <input
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <select
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.category_id}
              onChange={e => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">No category</option>
              {categories.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Unit</label>
              <input
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Low Stock Threshold</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.alert_threshold}
                onChange={e => setFormData({ ...formData, alert_threshold: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Expiry Date</label>
            <input
              type="date"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.expiry_date}
              onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
            />
            <p className="text-[10px] text-gray-400">Leave blank if this item does not expire.</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
