'use client'

import React, { useMemo, useState } from 'react'
import { History, BookOpen, Building2, User, Calendar } from 'lucide-react'
import { PatientRecord } from './types'
import { formatDate } from './utils'

interface MedicalTabProps {
  record: PatientRecord
}

export function MedicalTab({ record }: MedicalTabProps) {
  const treatments = record.treatmentHistory

  const clinicOptions = useMemo(() => {
    const names = new Set<string>()
    treatments.forEach(t => {
      const clinic = Array.isArray(t.clinics) ? t.clinics[0] : t.clinics
      if (clinic?.name) names.add(clinic.name)
    })
    return Array.from(names).sort()
  }, [treatments])

  const dentistOptions = useMemo(() => {
    const names = new Set<string>()
    treatments.forEach(t => {
      const d = Array.isArray(t.dentists) ? t.dentists[0] : t.dentists
      if (d) names.add(`${d.first_name} ${d.last_name}`)
    })
    return Array.from(names).sort()
  }, [treatments])

  const [filterClinic, setFilterClinic] = useState('')
  const [filterDentist, setFilterDentist] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  const filtered = useMemo(() => {
    let list = [...treatments]

    if (filterClinic) {
      list = list.filter(t => {
        const clinic = Array.isArray(t.clinics) ? t.clinics[0] : t.clinics
        return clinic?.name === filterClinic
      })
    }

    if (filterDentist) {
      list = list.filter(t => {
        const d = Array.isArray(t.dentists) ? t.dentists[0] : t.dentists
        return d ? `${d.first_name} ${d.last_name}` === filterDentist : false
      })
    }

    list.sort((a, b) => {
      const dateA = a.performed_at ? new Date(a.performed_at).getTime() : 0
      const dateB = b.performed_at ? new Date(b.performed_at).getTime() : 0
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return list
  }, [treatments, filterClinic, filterDentist, sortOrder])

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-base">Treatment History</h3>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={filterClinic}
              onChange={e => setFilterClinic(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {clinicOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={filterDentist}
              onChange={e => setFilterDentist(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Dentists</option>
              {dentistOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <BookOpen className="w-8 h-8 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No treatment records found</p>
              <p className="text-xs text-slate-400 mt-1">
                {filterClinic || filterDentist ? 'Try adjusting the filters above.' : 'Your treatment history will appear here.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <th className="px-5 py-3">Treatment</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Dentist</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(tr => {
                  const dentistObj = Array.isArray(tr.dentists) ? tr.dentists[0] : tr.dentists
                  const clinicObj = Array.isArray(tr.clinics) ? tr.clinics[0] : tr.clinics
                  return (
                    <tr key={tr.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {tr.services?.name ?? tr.treatment ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {clinicObj?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {dentistObj ? `Dr. ${dentistObj.first_name} ${dentistObj.last_name}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {tr.performed_at ? formatDate(tr.performed_at) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
