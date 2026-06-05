'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { addInventoryItem } from '@/actions/managementActions'

interface AddInventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clinicId: number
}

export default function AddInventoryModal({ isOpen, onClose, onSuccess, clinicId }: AddInventoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    unit: 'pcs',
    quantity: '',
    alert_threshold: '5'
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const result = await addInventoryItem(clinicId, {
      name: formData.name,
      unit: formData.unit,
      quantity: parseFloat(formData.quantity),
      alert_threshold: parseFloat(formData.alert_threshold)
    })

    if (result.success) {
      onSuccess()
      setFormData({ name: '', unit: 'pcs', quantity: '', alert_threshold: '5' })
      onClose()
    } else {
      setError(result.error || 'Failed to add item')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900">Add New Item</h2>
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
              placeholder="e.g. Latex Gloves (Medium)"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Initial Quantity</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Unit</label>
              <input
                required
                placeholder="pcs, boxes, ml..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Low Stock Threshold</label>
            <input
              required
              type="number"
              step="0.01"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.alert_threshold}
              onChange={e => setFormData({...formData, alert_threshold: e.target.value})}
            />
            <p className="text-[10px] text-gray-400">You&apos;ll be notified when stock falls to or below this level.</p>
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
              {isSubmitting ? 'Adding...' : 'Add Supply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
