'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { updateDentistWorkingHours } from '@/actions/dentistScheduleActions'
import AvailabilityClient, { type BlockedSlot } from '@/app/dentist-dashboard/availability/AvailabilityClient'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface WorkingHour {
  day_of_week: number
  start_time: string
  end_time: string
}

interface Dentist {
  id: number
  first_name: string
  last_name: string
}

interface DentistScheduleTabProps {
  dentists: Dentist[]
  initialBlockedSlotsMap: Record<number, BlockedSlot[]>
  initialWorkingHoursMap: Record<number, WorkingHour[]>
}

function buildHoursDefaults(saved: WorkingHour[]): WorkingHour[] {
  return DAYS.map((_, i) => {
    const found = saved.find(h => h.day_of_week === i)
    return {
      day_of_week: i,
      start_time: found?.start_time?.substring(0, 5) ?? '08:00',
      end_time: found?.end_time?.substring(0, 5) ?? '17:00',
    }
  })
}

function WorkingHoursEditor({ dentistId, hours }: { dentistId: number; hours: WorkingHour[] }) {
  const [rows, setRows] = useState<WorkingHour[]>(() => buildHoursDefaults(hours))
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const update = (day: number, field: 'start_time' | 'end_time', value: string) => {
    setRows(prev => prev.map(r => r.day_of_week === day ? { ...r, [field]: value } : r))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const res = await updateDentistWorkingHours(
        dentistId,
        rows.map(r => ({
          day_of_week: r.day_of_week,
          start_time: `${r.start_time}:00`,
          end_time: `${r.end_time}:00`,
        }))
      )
      setMsg(res.success
        ? { type: 'success', text: 'Working hours saved.' }
        : { type: 'error', text: res.error ?? 'Failed to save.' }
      )
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-3 bg-gray-50 px-4 py-2.5 border-b border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Day</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End</span>
        </div>
        {rows.map((row, idx) => (
          <div
            key={row.day_of_week}
            className={`grid grid-cols-3 items-center px-4 py-3 gap-3 bg-white ${idx < rows.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <span className="text-sm font-medium text-slate-700">{DAYS[row.day_of_week]}</span>
            <input
              type="time"
              value={row.start_time}
              onChange={e => update(row.day_of_week, 'start_time', e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="time"
              value={row.end_time}
              onChange={e => update(row.day_of_week, 'end_time', e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
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

export default function DentistScheduleTab({
  dentists,
  initialBlockedSlotsMap,
  initialWorkingHoursMap,
}: DentistScheduleTabProps) {
  const [selectedId, setSelectedId] = useState<number | null>(dentists[0]?.id ?? null)

  if (dentists.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">
        No dentists are assigned to this clinic.
      </p>
    )
  }

  const selectedDentist = dentists.find(d => d.id === selectedId)

  return (
    <div className="space-y-6">
      {/* Dentist picker */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
          Dentist
        </label>
        <select
          value={selectedId ?? ''}
          onChange={e => setSelectedId(Number(e.target.value))}
          className="flex-1 max-w-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
        >
          {dentists.map(d => (
            <option key={d.id} value={d.id}>
              Dr. {d.first_name} {d.last_name}
            </option>
          ))}
        </select>
      </div>

      {selectedId && selectedDentist && (
        <div className="space-y-8">
          {/* Working hours */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Working Hours</h3>
            <WorkingHoursEditor
              key={selectedId}
              dentistId={selectedId}
              hours={initialWorkingHoursMap[selectedId] ?? []}
            />
          </section>

          {/* Blocked slots */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Blocked Dates &amp; Slots</h3>
            <AvailabilityClient
              key={`avail-${selectedId}`}
              dentistId={selectedId}
              initialBlockedSlots={initialBlockedSlotsMap[selectedId] ?? []}
            />
          </section>
        </div>
      )}
    </div>
  )
}
