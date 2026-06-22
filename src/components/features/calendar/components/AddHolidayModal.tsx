'use client'

import { useState } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { manageClinicHolidays } from '@/actions/calendarActions'

interface AddHolidayModalProps {
  clinicId: number
  onClose: () => void
  onSuccess: () => void
}

export default function AddHolidayModal({ clinicId, onClose, onSuccess }: AddHolidayModalProps) {
  const [holidayDate, setHolidayDate] = useState('')
  const [holidayDesc, setHolidayDesc] = useState('')
  const [isSpecialDay, setIsSpecialDay] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!holidayDate || !holidayDesc) return
    setIsSubmitting(true)

    const result = await manageClinicHolidays(clinicId, 'add', {
      date: holidayDate,
      description: holidayDesc,
      is_special_day: isSpecialDay,
    })

    setIsSubmitting(false)
    if (result.success) {
      alert('Holiday/Closure added successfully!')
      onClose()
      onSuccess()
    } else {
      alert(result.error || 'Failed to add holiday')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs animate-in zoom-in-95 duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-900 text-lg">Set Clinic Holiday / Closure</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800">Date *</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 text-slate-700"
              value={holidayDate}
              onChange={e => setHolidayDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800">Holiday / Closure Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Independence Day, Clinic Renovations"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 text-slate-750"
              value={holidayDesc}
              onChange={e => setHolidayDesc(e.target.value)}
            />
          </div>

          <div className="space-y-2.5 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 focus:ring-blue-500 w-4 h-4"
                checked={isSpecialDay}
                onChange={e => setIsSpecialDay(e.target.checked)}
              />
              <span>Special Event (Clinic remains open)</span>
            </label>
            <p className="text-[10px] text-gray-400 italic">
              * If unchecked, the clinic will be marked as closed, and patients will not be able to book appointments on this date.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !holidayDate || !holidayDesc}
              className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Set Date'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
