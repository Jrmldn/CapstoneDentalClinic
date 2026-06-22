'use client'

import { useState } from 'react'
import { X, PlusCircle, MinusCircle } from 'lucide-react'
import { updateInventoryStock } from '@/actions/inventoryActions'
import type { InventoryItem } from './types'


interface UpdateStockModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

export default function UpdateStockModal({ item, isOpen, onClose, onSuccess, userId }: UpdateStockModalProps) {
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [type, setType] = useState<'add' | 'subtract'>('add')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !item) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const numericDelta = parseFloat(delta)
    if (isNaN(numericDelta) || numericDelta <= 0) {
      setError('Please enter a valid amount')
      setIsSubmitting(false)
      return
    }

    const finalDelta = type === 'add' ? numericDelta : -numericDelta
    
    const result = await updateInventoryStock(
      item.id,
      finalDelta,
      userId,
      reason || (type === 'add' ? 'Restock' : 'Usage')
    )

    if (result.success) {
      onSuccess()
      setDelta('')
      setReason('')
      onClose()
    } else {
      setError(result.error || 'Failed to update stock')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Update Stock</h2>
            <p className="text-xs text-gray-500 mt-1">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-900 transition p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium">{error}</div>}
          
          {/* Toggle Switch */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('add')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                type === 'add' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Restock
            </button>
            <button
              type="button"
              onClick={() => setType('subtract')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                type === 'subtract' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              Deduct
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Amount ({item.unit})</label>
              <input
                required
                type="number"
                step="5"
                placeholder="0"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={delta}
                onChange={e => setDelta(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Current: <span className="font-bold text-slate-600">{Number(item.quantity)} {item.unit}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Reason / Note</label>
              <textarea
                placeholder={type === 'add' ? 'e.g. Supplier delivery' : 'e.g. Used for appointment #123'}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-3 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 ${
                type === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? 'Updating...' : 'Confirm Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
