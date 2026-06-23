'use client'

import { useState, useTransition } from 'react'
import { Trash2, Plus, RefreshCw, CalendarX, Sparkles } from 'lucide-react'
import { manageClinicHolidays } from '@/actions/calendarActions'
import { formatDate } from '@/lib/date'

interface ClinicHoliday {
  id: number
  date: string
  description: string
  is_special_day: boolean
}

interface HolidaysFormProps {
  clinicId: number
  initialHolidays: ClinicHoliday[]
}

export default function HolidaysForm({ clinicId, initialHolidays }: HolidaysFormProps) {
  const [holidays, setHolidays] = useState<ClinicHoliday[]>(
    [...initialHolidays].sort((a, b) => a.date.localeCompare(b.date))
  )
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [isSpecial, setIsSpecial] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !description.trim()) return
    setError('')
    startTransition(async () => {
      const res = await manageClinicHolidays(clinicId, 'add', {
        date,
        description: description.trim(),
        is_special_day: isSpecial,
      })
      if (res.success) {
        // Optimistic: re-fetch is triggered by revalidatePath; for instant feedback add locally
        setHolidays(prev =>
          [...prev, { id: Date.now(), date, description: description.trim(), is_special_day: isSpecial }]
            .sort((a, b) => a.date.localeCompare(b.date))
        )
        setDate('')
        setDescription('')
        setIsSpecial(false)
      } else {
        setError(res.error || 'Failed to add holiday.')
      }
    })
  }

  const handleDelete = (holiday: ClinicHoliday) => {
    setError('')
    setDeletingId(holiday.id)
    startTransition(async () => {
      const res = await manageClinicHolidays(clinicId, 'remove', undefined, holiday.id)
      setDeletingId(null)
      if (res.success) {
        setHolidays(prev => prev.filter(h => h.id !== holiday.id))
      } else {
        setError(res.error || 'Failed to remove holiday.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-slate-50 rounded-xl border border-gray-200 p-4 space-y-4">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Add Holiday / Closure</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. National Holiday, Clinic Maintenance..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSpecial}
              onChange={e => setIsSpecial(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600">Mark as Special Day (clinic open, notable event)</span>
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50"
          >
            {isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add
          </button>
        </div>
      </form>

      {/* List */}
      {holidays.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No holidays or closures defined.</p>
      ) : (
        <div className="space-y-2">
          {holidays.map(holiday => (
            <div
              key={holiday.id}
              className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                {holiday.is_special_day ? (
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                ) : (
                  <CalendarX className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{holiday.description}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(holiday.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  holiday.is_special_day
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {holiday.is_special_day ? 'Special' : 'Closure'}
                </span>
                <button
                  onClick={() => handleDelete(holiday)}
                  disabled={deletingId === holiday.id || isPending}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40"
                  title="Remove"
                >
                  {deletingId === holiday.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
