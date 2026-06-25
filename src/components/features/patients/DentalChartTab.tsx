'use client'

import { useState } from 'react'
import { Plus, Layers } from 'lucide-react'
import type { DentalChart, ToothCondition } from './types'
import { updateDentalChart, ToothConditionData } from '@/actions/dentalChartActions'
import { formatDate, formatDateTime } from '@/lib/date'

interface DentalChartTabProps {
  patientId: number
  clinicId: number
  dentalCharts: DentalChart[]
  dentistId?: number
  onRefresh: () => Promise<void>
}

const upperTeeth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
const lowerTeeth = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]

// Mapping child primary teeth to columns under permanent 4 to 13
const upperPrimaryTeeth = [
  { id: 'A', parent: 4 },
  { id: 'B', parent: 5 },
  { id: 'C', parent: 6 },
  { id: 'D', parent: 7 },
  { id: 'E', parent: 8 },
  { id: 'F', parent: 9 },
  { id: 'G', parent: 10 },
  { id: 'H', parent: 11 },
  { id: 'I', parent: 12 },
  { id: 'J', parent: 13 }
]

// Mapping child primary teeth to columns above permanent 20 to 29
const lowerPrimaryTeeth = [
  { id: 'K', parent: 20 },
  { id: 'L', parent: 21 },
  { id: 'M', parent: 22 },
  { id: 'N', parent: 23 },
  { id: 'O', parent: 24 },
  { id: 'P', parent: 25 },
  { id: 'Q', parent: 26 },
  { id: 'R', parent: 27 },
  { id: 'S', parent: 28 },
  { id: 'T', parent: 29 }
]

const conditionKeys = [
  { id: 'healthy', label: 'Healthy', border: 'border-emerald-500 text-emerald-700 bg-emerald-50/20', dot: 'bg-emerald-500' },
  { id: 'decayed', label: 'Decayed', border: 'border-red-500 text-red-700 bg-red-50/20', dot: 'bg-red-500' },
  { id: 'filled', label: 'Filled', border: 'border-blue-500 text-blue-700 bg-blue-50/20', dot: 'bg-blue-500' },
  { id: 'crown', label: 'Crown', border: 'border-purple-500 text-purple-700 bg-purple-50/20', dot: 'bg-purple-500' },
  { id: 'missing', label: 'Missing', border: 'border-slate-350 text-slate-500 bg-slate-50', dot: 'bg-slate-400' },
  { id: 'extraction', label: 'Extraction', border: 'border-amber-500 text-amber-700 bg-amber-50/20', dot: 'bg-amber-500' },
  { id: 'implant', label: 'Implant', border: 'border-cyan-500 text-cyan-700 bg-cyan-50/20', dot: 'bg-cyan-500' },
  { id: 'bridge', label: 'Bridge', border: 'border-amber-600 text-amber-800 bg-amber-100/20', dot: 'bg-amber-600' },
  { id: 'root_canal', label: 'Root Canal', border: 'border-rose-600 text-rose-700 bg-rose-50/20', dot: 'bg-rose-600' },
  { id: 'periapical', label: 'Periapical', border: 'border-pink-500 text-pink-700 bg-pink-50/20', dot: 'bg-pink-500' }
]

export default function DentalChartTab({
  patientId,
  clinicId,
  dentalCharts,
  dentistId,
  onRefresh
}: DentalChartTabProps) {
  const [showPrimary, setShowPrimary] = useState(false)
  const [selectedTooth, setSelectedTooth] = useState<string>('26')
  const [toothType, setToothType] = useState<'permanent' | 'primary'>('permanent')

  // Form states
  const [showConditionForm, setShowConditionForm] = useState(false)
  const [condition, setCondition] = useState('healthy')
  const [surface, setSurface] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [isSubmittingCondition, setIsSubmittingCondition] = useState(false)

  // Pre-calculate tooth conditions map
  const toothConditionsMap: Record<string, { condition: string; notes?: string; recorded_at: string }> = {}
  dentalCharts?.forEach(chart => {
    chart.tooth_conditions?.forEach(cond => {
      // Use string keys since child teeth are letters (A-T) and adult teeth are numbers (1-32)
      const key = cond.tooth_number.toString()
      const existing = toothConditionsMap[key]
      if (!existing || new Date(cond.recorded_at) > new Date(existing.recorded_at)) {
        toothConditionsMap[key] = {
          condition: cond.condition,
          notes: cond.notes ?? undefined,
          recorded_at: cond.recorded_at
        }
      }
    })
  })

  const handleSelectTooth = (id: string, type: 'permanent' | 'primary') => {
    setSelectedTooth(id)
    setToothType(type)
    const existing = toothConditionsMap[id]
    if (existing) {
      setCondition(existing.condition)
      setConditionNotes(existing.notes || '')
    } else {
      setCondition('healthy')
      setConditionNotes('')
    }
  }

  const handleAddConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingCondition(true)

    // Translate alpha tooth to numeric representation for tooth_conditions table if needed,
    // or store it as ascii code/direct mapping if database expects an integer tooth_number.
    // Wait, in the database table schema, let's check:
    // tooth_number is a number!
    // So for child teeth A-T, we can map them to unique numbers or use an ASCII mapping:
    // A=65, B=66, etc.
    // Let's see if the database has a tooth_number column that is integer. Yes, we saw `tooth_number: number` in Supabase types!
    // So let's map A-T to numbers 101-120 or similar, or A=101, B=102, C=103... T=120, to keep them numeric.
    // Let's write a small helper:
    const getToothNumberValue = (id: string): number => {
      if (isNaN(Number(id))) {
        // Child tooth (A-T) -> Map A (65) to 101, B (66) to 102...
        return id.charCodeAt(0) + 36 // A is 65 -> 65 + 36 = 101
      }
      return Number(id)
    }

    const numericToothNum = getToothNumberValue(selectedTooth)

    const conditionData: ToothConditionData = {
      tooth_number: numericToothNum,
      tooth_type: toothType,
      condition,
      surface: surface || undefined,
      notes: conditionNotes || undefined
    }

    const res = await updateDentalChart(
      patientId,
      clinicId,
      dentistId!,
      [conditionData]
    )

    setIsSubmittingCondition(false)
    if (res.success) {
      alert('Dental chart updated successfully!')
      setSurface('')
      setShowConditionForm(false)
      await onRefresh()
    } else {
      alert(res.error || 'Failed to update dental chart')
    }
  }

  // Get active condition for selected tooth
  const selectedCondition = toothConditionsMap[selectedTooth]
  const conditionDetail = conditionKeys.find(c => c.id === (selectedCondition?.condition || 'healthy'))

  // Convert numeric tooth number in logs back to character for display
  const displayToothLabel = (num: number): string => {
    if (num >= 101 && num <= 120) {
      return String.fromCharCode(num - 36) // 101 -> A
    }
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Dental Chart Mockup View */}
      <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-xs space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Dynamic Dental Chart</h4>
            <p className="text-xs text-gray-500 mt-0.5">Click a tooth to view conditions or update records.</p>
          </div>
          <button
            onClick={() => setShowPrimary(!showPrimary)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs border border-gray-250/60"
          >
            <Layers className="w-3.5 h-3.5" />
            {showPrimary ? 'Hide Primary Teeth' : 'Show Primary Teeth'}
          </button>
        </div>

        {/* Visual Chart Grid */}
        <div className="overflow-x-auto pb-4 pt-1">
          <div className="min-w-[760px] flex flex-col gap-6 items-center select-none">
            {/* FACIAL / BUCCAL indicator */}
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FACIAL / BUCCAL ↑</span>

            {/* Upper Arch Container */}
            <div className="flex flex-col items-center gap-2 w-full">
              {/* Permanent Upper (1-16) */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-bold w-14 text-right pr-2">Right (1-8)</span>
                <div className="flex gap-1.5">
                  {upperTeeth.map(num => {
                    const idStr = num.toString()
                    const isSelected = selectedTooth === idStr
                    const cond = toothConditionsMap[idStr]?.condition || 'healthy'
                    const keyObj = conditionKeys.find(c => c.id === cond)

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSelectTooth(idStr, 'permanent')}
                        className={`w-9 h-11 border-2 rounded-lg flex flex-col justify-between items-center p-1 text-[11px] font-extrabold transition-all duration-150 ${
                          keyObj?.border || 'border-slate-200 text-slate-700'
                        } ${isSelected ? 'ring-2 ring-slate-900 border-slate-900 scale-105 shadow-sm' : ''}`}
                      >
                        <span>{num}</span>
                        <span className="text-[9px] text-gray-400 font-bold">—</span>
                      </button>
                    )
                  })}
                </div>
                <span className="text-[10px] text-gray-400 font-bold w-16 pl-2">Left (9-16)</span>
              </div>

              {/* Primary Upper (A-J) */}
              {showPrimary && (
                <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
                  <span className="text-[10px] text-gray-400 font-bold w-14" />
                  <div className="flex gap-1.5 pl-[108px]">
                    {upperPrimaryTeeth.map(child => {
                      const isSelected = selectedTooth === child.id
                      const cond = toothConditionsMap[child.id]?.condition || 'healthy'
                      const keyObj = conditionKeys.find(c => c.id === cond)

                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleSelectTooth(child.id, 'primary')}
                          className={`w-9 h-10 border-2 rounded-lg flex flex-col justify-center items-center text-xs font-extrabold transition-all duration-150 ${
                            keyObj?.border || 'border-slate-200 text-slate-700'
                          } ${isSelected ? 'ring-2 ring-slate-900 border-slate-900 scale-105 shadow-sm' : ''}`}
                        >
                          {child.id}
                        </button>
                      )
                    })}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold w-16" />
                </div>
              )}
            </div>

            {/* MIDLINE divider */}
            <div className="w-full flex items-center justify-between border-b border-dashed border-gray-300 relative py-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest absolute left-1/2 -translate-x-1/2 bg-white px-3">Midline</span>
            </div>

            {/* Lower Arch Container */}
            <div className="flex flex-col items-center gap-2 w-full">
              {/* Primary Lower (K-T) */}
              {showPrimary && (
                <div className="flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-150">
                  <span className="text-[10px] text-gray-400 font-bold w-14" />
                  <div className="flex gap-1.5 pl-[108px]">
                    {lowerPrimaryTeeth.map(child => {
                      const isSelected = selectedTooth === child.id
                      const cond = toothConditionsMap[child.id]?.condition || 'healthy'
                      const keyObj = conditionKeys.find(c => c.id === cond)

                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleSelectTooth(child.id, 'primary')}
                          className={`w-9 h-10 border-2 rounded-lg flex flex-col justify-center items-center text-xs font-extrabold transition-all duration-150 ${
                            keyObj?.border || 'border-slate-200 text-slate-700'
                          } ${isSelected ? 'ring-2 ring-slate-900 border-slate-900 scale-105 shadow-sm' : ''}`}
                        >
                          {child.id}
                        </button>
                      )
                    })}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold w-16" />
                </div>
              )}

              {/* Permanent Lower (17-32) */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-bold w-14 text-right pr-2">Right (17-24)</span>
                <div className="flex gap-1.5">
                  {lowerTeeth.map(num => {
                    const idStr = num.toString()
                    const isSelected = selectedTooth === idStr
                    const cond = toothConditionsMap[idStr]?.condition || 'healthy'
                    const keyObj = conditionKeys.find(c => c.id === cond)

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSelectTooth(idStr, 'permanent')}
                        className={`w-9 h-11 border-2 rounded-lg flex flex-col justify-between items-center p-1 text-[11px] font-extrabold transition-all duration-150 ${
                          keyObj?.border || 'border-slate-200 text-slate-700'
                        } ${isSelected ? 'ring-2 ring-slate-900 border-slate-900 scale-105 shadow-sm' : ''}`}
                      >
                        <span className="text-[9px] text-gray-400 font-bold">—</span>
                        <span>{num}</span>
                      </button>
                    )
                  })}
                </div>
                <span className="text-[10px] text-gray-400 font-bold w-16 pl-2">Left (25-32)</span>
              </div>
            </div>

            {/* LINGUAL indicator */}
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">↓ LINGUAL</span>
          </div>
        </div>

        {/* Selected Tooth Detail Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-slate-800">Tooth #{selectedTooth}</span>
            <p className="text-xs text-slate-500">
              Type: <span className="capitalize font-semibold">{toothType}</span>
              {selectedCondition?.notes ? ` · Notes: ${selectedCondition.notes}` : ''}
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
            conditionDetail?.border || 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            {conditionDetail?.label || 'Healthy'}
          </span>
        </div>

        {/* CONDITION KEY */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Condition Key</span>
          <div className="flex flex-wrap gap-3.5 bg-slate-50 p-4 rounded-xl border border-gray-150">
            {conditionKeys.map(k => (
              <div key={k.id} className="flex items-center gap-2 text-[11px] font-bold text-slate-650">
                <span className={`w-3.5 h-3.5 rounded-full ${k.dot} border border-white shadow-2xs flex-shrink-0`} />
                <span>{k.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dentist update form */}
      {dentistId && (
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-800 text-sm">Update Tooth Condition</h4>
            <button
              onClick={() => setShowConditionForm(!showConditionForm)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              {showConditionForm ? 'Hide Form' : 'Record Tooth Condition'}
            </button>
          </div>

          {showConditionForm && (
            <form onSubmit={handleAddConditionSubmit} className="space-y-4 border-t border-gray-150 pt-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Selected Tooth</span>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-slate-100 font-bold"
                    value={`Tooth #${selectedTooth}`}
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Tooth Type</span>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-slate-100 font-bold capitalize"
                    value={toothType}
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Condition</span>
                  <select
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none"
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                  >
                    {conditionKeys.map(k => (
                      <option key={k.id} value={k.id}>{k.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Surface (Optional)</span>
                  <input
                    type="text"
                    placeholder="e.g. O, M, D, B, L"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none"
                    value={surface}
                    onChange={e => setSurface(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Observation Notes</span>
                <input
                  type="text"
                  placeholder="e.g. Minor cavity, check next visit"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none"
                  value={conditionNotes}
                  onChange={e => setConditionNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConditionForm(false)}
                  className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCondition}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                >
                  {isSubmittingCondition ? 'Saving...' : 'Save Condition'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
        <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-1.5 mb-4 gap-2">
          <h4 className="font-bold text-slate-800 text-sm">Dental Chart History</h4>
          {(() => {
            const latestChart = dentalCharts?.[0]
            if (!latestChart) return null
            const dentistObj = Array.isArray(latestChart.dentists) ? latestChart.dentists[0] : latestChart.dentists
            const clinicObj = Array.isArray(latestChart.clinics) ? latestChart.clinics[0] : latestChart.clinics
            if (!dentistObj && !clinicObj) return null
            const dentistName = dentistObj ? `Dr. ${dentistObj.first_name} ${dentistObj.last_name}` : 'Attending Dentist'
            const branchName = clinicObj?.name || 'Clinic'
            const updateDate = latestChart.updated_at || latestChart.created_at
            return (
              <span className="text-[10px] text-slate-400 font-semibold">
                Last updated by {dentistName} ({branchName}) at {formatDateTime(updateDate)}
              </span>
            )
          })()}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-gray-100">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Tooth</th>
                <th className="px-4 py-2.5">Tooth Type</th>
                <th className="px-4 py-2.5">Condition</th>
                <th className="px-4 py-2.5">Surface</th>
                <th className="px-4 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-slate-700">
              {dentalCharts?.flatMap((chart) =>
                chart.tooth_conditions?.map((cond: ToothCondition) => (
                  <tr key={cond.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-400">
                      {formatDate(cond.recorded_at)}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      Tooth #{displayToothLabel(cond.tooth_number)}
                    </td>
                    <td className="px-4 py-3 capitalize">{cond.tooth_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                        conditionKeys.find(k => k.id === cond.condition)?.border || 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {cond.condition.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase font-semibold text-slate-600">{cond.surface || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{cond.notes || '—'}</td>
                  </tr>
                ))
              )}
              {dentalCharts?.flatMap((c) => c.tooth_conditions ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    No tooth conditions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
