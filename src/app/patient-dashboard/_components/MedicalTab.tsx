'use client'

import React, { useState, useMemo } from 'react'
import { ClipboardList } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PatientRecord } from './types'
import { formatDate } from './utils'

interface MedicalTabProps {
  record: PatientRecord
}

export function MedicalTab({ record }: MedicalTabProps) {
  const [branchFilter, setBranchFilter] = useState('')
  const [dentistFilter, setDentistFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')

  const { totalVisits, lastVisit, primaryDentist } = useMemo(() => {
    const history = record.treatmentHistory
    const total = history.length

    const sorted = [...history].filter(t => t.performed_at).sort(
      (a, b) => new Date(b.performed_at!).getTime() - new Date(a.performed_at!).getTime()
    )
    const last = sorted[0]?.performed_at ? formatDate(sorted[0].performed_at) : '—'

    const dentistCount: Record<string, number> = {}
    for (const t of history) {
      if (t.dentists) {
        const name = `Dr. ${t.dentists.first_name} ${t.dentists.last_name}`
        dentistCount[name] = (dentistCount[name] ?? 0) + 1
      }
    }
    const primary = Object.entries(dentistCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

    return { totalVisits: total, lastVisit: last, primaryDentist: primary }
  }, [record.treatmentHistory])

  const uniqueBranches = useMemo(() => {
    const names = new Set<string>()
    for (const t of record.treatmentHistory) {
      if (t.clinics?.name) names.add(t.clinics.name)
    }
    return Array.from(names).sort()
  }, [record.treatmentHistory])

  const uniqueDentists = useMemo(() => {
    const names = new Set<string>()
    for (const t of record.treatmentHistory) {
      if (t.dentists) names.add(`Dr. ${t.dentists.first_name} ${t.dentists.last_name}`)
    }
    return Array.from(names).sort()
  }, [record.treatmentHistory])

  const filtered = useMemo(() => {
    return record.treatmentHistory.filter(t => {
      if (branchFilter && t.clinics?.name !== branchFilter) return false
      if (dentistFilter) {
        const name = t.dentists ? `Dr. ${t.dentists.first_name} ${t.dentists.last_name}` : ''
        if (name !== dentistFilter) return false
      }
      if (monthFilter && t.performed_at) {
        const ym = t.performed_at.slice(0, 7)
        if (ym !== monthFilter) return false
      }
      return true
    })
  }, [record.treatmentHistory, branchFilter, dentistFilter, monthFilter])

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Visits</span>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{totalVisits}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Visit</span>
          <p className="text-sm font-bold text-slate-800 mt-1">{lastVisit}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Primary Dentist</span>
          <p className="text-sm font-bold text-slate-800 mt-1">{primaryDentist}</p>
        </div>
      </div>

      {/* Treatment History card */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Treatment History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none text-slate-700 focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            >
              <option value="">All Branches</option>
              {uniqueBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={dentistFilter}
              onChange={e => setDentistFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none text-slate-700 focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            >
              <option value="">All Dentists</option>
              {uniqueDentists.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <input
              type="month"
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none text-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* List */}
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map(t => (
                <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold text-slate-900">{t.services?.name ?? 'Treatment'}</h5>
                    <span className="text-xs text-slate-400 shrink-0 ml-3">
                      {t.performed_at ? formatDate(t.performed_at) : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.dentists ? `Dr. ${t.dentists.first_name} ${t.dentists.last_name}` : ''}
                    {t.clinics?.name ? ` · ${t.clinics.name}` : ''}
                  </p>
                  {t.notes && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">{t.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">No treatments found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
