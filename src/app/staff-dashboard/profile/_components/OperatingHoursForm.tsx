'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { updateOperatingHours } from '@/actions/clinicSetupActions'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface HourRow {
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}

interface Props {
  clinicId: number
  operatingHours: Record<string, unknown>[]
}

function buildDefaults(saved: Record<string, unknown>[]): HourRow[] {
  return DAYS.map((_, i) => {
    const found = saved.find(h => Number(h.day_of_week) === i)
    return {
      day_of_week: i,
      open_time:   found ? String(found.open_time ?? '08:00') : '08:00',
      close_time:  found ? String(found.close_time ?? '17:00') : '17:00',
      is_closed:   found ? Boolean(found.is_closed) : i === 0, // Sunday closed by default
    }
  })
}

export default function OperatingHoursForm({ clinicId, operatingHours }: Props) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hours, setHours] = useState<HourRow[]>(buildDefaults(operatingHours))

  const update = (day: number, field: keyof HourRow, value: string | boolean) => {
    setHours(prev => prev.map(h => h.day_of_week === day ? { ...h, [field]: value } : h))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const result = await updateOperatingHours(clinicId, hours.map(h => ({
        day_of_week: h.day_of_week,
        open_time:   h.is_closed ? null : h.open_time,
        close_time:  h.is_closed ? null : h.close_time,
        is_closed:   h.is_closed,
      })))
      setMsg(result.success
        ? { type: 'success', text: 'Operating hours saved.' }
        : { type: 'error', text: result.error ?? 'Failed to save.' }
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <h2 className="text-base font-semibold text-slate-800">Weekly Operating Hours</h2>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-4 bg-gray-50 px-4 py-2.5 border-b border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Day</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Open</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Close</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Closed</span>
        </div>

        {hours.map((row, idx) => (
          <div
            key={row.day_of_week}
            className={`grid grid-cols-4 items-center px-4 py-3 gap-3 ${
              idx < hours.length - 1 ? 'border-b border-gray-100' : ''
            } ${row.is_closed ? 'bg-gray-50 opacity-70' : 'bg-white'}`}
          >
            <span className="text-sm font-medium text-slate-700">{DAYS[row.day_of_week]}</span>

            <input
              type="time"
              value={row.open_time ?? ''}
              disabled={row.is_closed}
              onChange={e => update(row.day_of_week, 'open_time', e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
            />

            <input
              type="time"
              value={row.close_time ?? ''}
              disabled={row.is_closed}
              onChange={e => update(row.day_of_week, 'close_time', e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
            />

            <div className="flex justify-center">
              <input
                id={`closed-${row.day_of_week}`}
                type="checkbox"
                checked={row.is_closed}
                onChange={e => update(row.day_of_week, 'is_closed', e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          id="save-hours-btn"
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Saving…' : 'Save Hours'}
        </button>
      </div>
    </form>
  )
}
