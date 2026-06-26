'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
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

// FDI (ISO 3950) tooth numbering
const upperPermanent = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const upperTemporary = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
const lowerTemporary = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]
const lowerPermanent = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

function getToothType(num: number): 'permanent' | 'temporary' {
  return num >= 51 && num <= 85 ? 'temporary' : 'permanent'
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Vivid solid clinical colors (fills match legend dots exactly)
const VIVID_FILL: Record<string, string> = {
  healthy:    '#f8fafc',
  decayed:    '#ef4444',
  filled:     '#3b82f6',
  crown:      '#a855f7',
  missing:    '#94a3b8',
  extraction: '#f97316',
  implant:    '#06b6d4',
  bridge:     '#d97706',
  root_canal: '#be123c',
  periapical: '#ec4899',
}

const RING_COLOR: Record<string, string> = {
  healthy:    '#cbd5e1',
  decayed:    '#ef4444',
  filled:     '#3b82f6',
  crown:      '#a855f7',
  missing:    '#94a3b8',
  extraction: '#f97316',
  implant:    '#06b6d4',
  bridge:     '#d97706',
  root_canal: '#be123c',
  periapical: '#ec4899',
}

const conditionKeys = [
  { id: 'healthy',    label: 'Healthy',    dot: 'bg-slate-200' },
  { id: 'decayed',    label: 'Decayed',    dot: 'bg-red-500' },
  { id: 'filled',     label: 'Filled',     dot: 'bg-blue-500' },
  { id: 'crown',      label: 'Crown',      dot: 'bg-purple-500' },
  { id: 'missing',    label: 'Missing',    dot: 'bg-slate-400' },
  { id: 'extraction', label: 'Extraction', dot: 'bg-orange-500' },
  { id: 'implant',    label: 'Implant',    dot: 'bg-cyan-500' },
  { id: 'bridge',     label: 'Bridge',     dot: 'bg-amber-600' },
  { id: 'root_canal', label: 'Root Canal', dot: 'bg-rose-700' },
  { id: 'periapical', label: 'Periapical', dot: 'bg-pink-500' },
]

// SVG geometry constants
const CX = 20, CY = 20, OUTER = 18, INNER = 8

const OUTER_SURFACES = [
  { name: 'buccal',  a1: 315, a2: 45  },
  { name: 'distal',  a1: 45,  a2: 135 },
  { name: 'lingual', a1: 135, a2: 225 },
  { name: 'mesial',  a1: 225, a2: 315 },
]

const ALL_SURFACE_NAMES = ['buccal', 'distal', 'lingual', 'mesial', 'occlusal']

// MODBL display order and abbreviations
const SURFACE_ORDER = ['mesial', 'occlusal', 'distal', 'buccal', 'lingual']
const SURFACE_ABBR: Record<string, string> = { mesial: 'M', occlusal: 'O', distal: 'D', buccal: 'B', lingual: 'L' }

const DIVIDER_ANGLES = [45, 135, 225, 315]

function polarToXY(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return {
    x: parseFloat((cx + r * Math.cos(rad)).toFixed(3)),
    y: parseFloat((cy + r * Math.sin(rad)).toFixed(3)),
  }
}

function donutPath(cx: number, cy: number, inner: number, outer: number, a1: number, a2: number): string {
  const effectiveA2 = a2 <= a1 ? a2 + 360 : a2
  const large = (effectiveA2 - a1) > 180 ? 1 : 0
  const p1 = polarToXY(cx, cy, outer, a1)
  const p2 = polarToXY(cx, cy, outer, a2)
  const p3 = polarToXY(cx, cy, inner, a2)
  const p4 = polarToXY(cx, cy, inner, a1)
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outer} ${outer} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ')
}

// Returns the live SVG fill: draft condition > selection blue > historical vivid color
function getLiveFill(
  key: string,
  historicalCondition: string,
  selectedSurfaces: Set<string>,
  surfaceConditions: Record<string, string>
): string {
  if (!selectedSurfaces.has(key)) {
    return VIVID_FILL[historicalCondition] ?? '#f8fafc'
  }
  const draft = surfaceConditions[key]
  if (draft) return VIVID_FILL[draft] ?? '#3b82f6'
  return '#3b82f6'
}

interface ToothSvgProps {
  num: number
  surfaceMap: Record<string, string>
  selectedSurfaces: Set<string>
  surfaceConditions: Record<string, string>
  onToggleSurface: (num: number, surface: string) => void
}

function ToothSvg({ num, surfaceMap, selectedSurfaces, surfaceConditions, onToggleSurface }: ToothSvgProps) {
  const overallCond = Object.values(surfaceMap).find(c => c !== 'healthy') ?? 'healthy'
  const ringStroke = RING_COLOR[overallCond] ?? '#cbd5e1'

  return (
    <svg viewBox="0 0 40 40" width="40" height="40" style={{ display: 'block' }}>
      {/* 4 outer surface sectors */}
      {OUTER_SURFACES.map(({ name, a1, a2 }) => {
        const key = `${num}-${name}`
        const isSelected = selectedSurfaces.has(key)
        const fill = getLiveFill(key, surfaceMap[name] ?? 'healthy', selectedSurfaces, surfaceConditions)
        const effectiveCond = isSelected ? (surfaceConditions[key] ?? 'selected') : (surfaceMap[name] ?? 'healthy')
        return (
          <g key={name} onClick={() => onToggleSurface(num, name)} style={{ cursor: 'pointer' }}>
            <title>Tooth #{num} — {cap(name)} ({effectiveCond})</title>
            <path
              d={donutPath(CX, CY, INNER, OUTER, a1, a2)}
              fill={fill}
              stroke={isSelected ? '#3b82f6' : 'none'}
              strokeWidth={isSelected ? '2' : '0'}
              className="transition-opacity hover:opacity-80"
            />
          </g>
        )
      })}

      {/* Occlusal center circle */}
      {(() => {
        const key = `${num}-occlusal`
        const isSelected = selectedSurfaces.has(key)
        const fill = getLiveFill(key, surfaceMap['occlusal'] ?? 'healthy', selectedSurfaces, surfaceConditions)
        const effectiveCond = isSelected ? (surfaceConditions[key] ?? 'selected') : (surfaceMap['occlusal'] ?? 'healthy')
        return (
          <g onClick={() => onToggleSurface(num, 'occlusal')} style={{ cursor: 'pointer' }}>
            <title>Tooth #{num} — Occlusal ({effectiveCond})</title>
            <circle
              cx={CX} cy={CY} r={INNER}
              fill={fill}
              stroke={isSelected ? '#3b82f6' : 'none'}
              strokeWidth={isSelected ? '2' : '0'}
              className="transition-opacity hover:opacity-80"
            />
          </g>
        )
      })()}

      {/* White surface crosshair dividers */}
      {DIVIDER_ANGLES.map(angle => {
        const p = polarToXY(CX, CY, OUTER, angle)
        return (
          <line key={angle} x1={CX} y1={CY} x2={p.x} y2={p.y}
            stroke="white" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />
        )
      })}

      {/* Outer ring border */}
      <circle cx={CX} cy={CY} r={OUTER} fill="none"
        stroke={ringStroke} strokeWidth="1.5" style={{ pointerEvents: 'none' }} />
    </svg>
  )
}

interface ToothButtonProps {
  num: number
  surfaceMap: Record<string, string>
  selectedSurfaces: Set<string>
  surfaceConditions: Record<string, string>
  onToggleSurface: (num: number, surface: string) => void
  onToggleWhole: (num: number) => void
}

function ToothButton({ num, surfaceMap, selectedSurfaces, surfaceConditions, onToggleSurface, onToggleWhole }: ToothButtonProps) {
  const hasAllSelected = ALL_SURFACE_NAMES.every(s => selectedSurfaces.has(`${num}-${s}`))
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={() => onToggleWhole(num)}
        title="Click to select / deselect all surfaces"
        className={`text-[10px] font-bold transition underline-offset-2 leading-none ${
          hasAllSelected
            ? 'text-blue-700 underline'
            : 'text-slate-400 hover:text-slate-700 hover:underline'
        }`}
      >
        {num}
      </button>
      <ToothSvg
        num={num}
        surfaceMap={surfaceMap}
        selectedSurfaces={selectedSurfaces}
        surfaceConditions={surfaceConditions}
        onToggleSurface={onToggleSurface}
      />
    </div>
  )
}

// History grouped by date + tooth number
interface HistoryGroup {
  recorded_at: string
  tooth_number: number
  // per-surface: surface -> { condition, notes }
  surfaceCondMap: Record<string, string>
  surfaceNoteMap: Record<string, string>
  // whole-tooth entries (null surface)
  wholeCondition: string | null
  wholeNotes: string | null
}

export default function DentalChartTab({
  patientId,
  clinicId,
  dentalCharts,
  dentistId,
  onRefresh,
}: DentalChartTabProps) {
  const [showPrimary, setShowPrimary] = useState(true)
  const [selectedSurfaces, setSelectedSurfaces] = useState<Set<string>>(new Set())
  const [surfaceConditions, setSurfaceConditions] = useState<Record<string, string>>({})
  const [surfaceNotes, setSurfaceNotes] = useState<Record<string, string>>({})
  const [showConditionForm, setShowConditionForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-cleanup: remove state for surfaces that were deselected
  useEffect(() => {
    setSurfaceConditions(prev => {
      const cleaned = { ...prev }
      Object.keys(cleaned).forEach(k => { if (!selectedSurfaces.has(k)) delete cleaned[k] })
      return cleaned
    })
    setSurfaceNotes(prev => {
      const cleaned = { ...prev }
      Object.keys(cleaned).forEach(k => { if (!selectedSurfaces.has(k)) delete cleaned[k] })
      return cleaned
    })
  }, [selectedSurfaces])

  // Build per-surface and whole-tooth condition maps from saved chart data (latest wins)
  const surfaceConditionsMap: Record<string, { condition: string; recorded_at: string }> = {}
  const toothWideMap: Record<number, string> = {}

  ;(dentalCharts ?? []).forEach(chart => {
    ;(chart.tooth_conditions ?? []).forEach(cond => {
      if (cond.surface) {
        const key = `${cond.tooth_number}-${cond.surface}`
        const existing = surfaceConditionsMap[key]
        if (!existing || new Date(cond.recorded_at) > new Date(existing.recorded_at)) {
          surfaceConditionsMap[key] = { condition: cond.condition, recorded_at: cond.recorded_at }
        }
      } else {
        toothWideMap[cond.tooth_number] = cond.condition
      }
    })
  })

  function buildSurfaceMap(num: number): Record<string, string> {
    return Object.fromEntries(
      ALL_SURFACE_NAMES.map(s => [
        s,
        surfaceConditionsMap[`${num}-${s}`]?.condition ?? toothWideMap[num] ?? 'healthy',
      ])
    )
  }

  function toggleSurface(num: number, surface: string) {
    const key = `${num}-${surface}`
    setSelectedSurfaces(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  function toggleWholeTooth(num: number) {
    const keys = ALL_SURFACE_NAMES.map(s => `${num}-${s}`)
    const allSelected = keys.every(k => selectedSurfaces.has(k))
    setSelectedSurfaces(prev => {
      const next = new Set(prev)
      if (allSelected) {
        keys.forEach(k => next.delete(k))
      } else {
        keys.forEach(k => next.add(k))
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dentistId || selectedSurfaces.size === 0) return
    setIsSubmitting(true)

    const conditionsData: ToothConditionData[] = Array.from(selectedSurfaces).map(key => {
      const dashIdx = key.indexOf('-')
      const num = Number(key.slice(0, dashIdx))
      const surface = key.slice(dashIdx + 1)
      return {
        tooth_number: num,
        tooth_type: getToothType(num),
        condition: surfaceConditions[key] ?? 'healthy',
        surface,
        notes: surfaceNotes[key] || undefined,
      }
    })

    const res = await updateDentalChart(patientId, clinicId, dentistId, conditionsData)
    setIsSubmitting(false)

    if (res.success) {
      alert('Dental chart updated successfully!')
      setSurfaceConditions({})
      setSurfaceNotes({})
      setShowConditionForm(false)
      setSelectedSurfaces(new Set())
      await onRefresh()
    } else {
      alert(res.error ?? 'Failed to update dental chart')
    }
  }

  // Build history groups: group by date + tooth number (descending)
  const allConds: ToothCondition[] = (dentalCharts ?? []).flatMap(c => c.tooth_conditions ?? [])

  const groupMap = new Map<string, HistoryGroup>()
  ;[...allConds]
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    .forEach(cond => {
      const dateStr = new Date(cond.recorded_at).toISOString().split('T')[0] ?? ''
      const groupKey = `${dateStr}-${cond.tooth_number}`
      const existing = groupMap.get(groupKey)
      if (existing) {
        if (cond.surface) {
          existing.surfaceCondMap[cond.surface] = cond.condition
          if (cond.notes) existing.surfaceNoteMap[cond.surface] = cond.notes
        } else {
          existing.wholeCondition = cond.condition
          if (cond.notes) existing.wholeNotes = cond.notes
        }
      } else {
        groupMap.set(groupKey, {
          recorded_at: cond.recorded_at,
          tooth_number: cond.tooth_number,
          surfaceCondMap: cond.surface ? { [cond.surface]: cond.condition } : {},
          surfaceNoteMap: (cond.surface && cond.notes) ? { [cond.surface]: cond.notes } : {},
          wholeCondition: cond.surface ? null : cond.condition,
          wholeNotes: (!cond.surface && cond.notes) ? cond.notes : null,
        })
      }
    })

  const historyGroups = Array.from(groupMap.values())
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())

  const selectedList = Array.from(selectedSurfaces)
  const uniqueTeethCount = new Set(selectedList.map(k => k.split('-')[0])).size

  return (
    <div className="space-y-6">
      {/* Main chart panel */}
      <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-xs space-y-5">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Dental Chart (FDI / ISO 3950)</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Click a tooth number to select all its surfaces. Click individual surface zones for granular selection.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowPrimary(v => !v)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition border border-gray-200/60"
            >
              {showPrimary ? 'Hide Primary Teeth' : 'Show Primary Teeth'}
            </button>
            {selectedSurfaces.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSurfaces(new Set())}
                className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-700 underline transition"
              >
                Clear ({selectedSurfaces.size})
              </button>
            )}
          </div>
        </div>

        {/* Condition key — positioned ABOVE the chart */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-3 bg-slate-50 p-3.5 rounded-xl border border-gray-150">
            {conditionKeys.map(k => (
              <div key={k.id} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <span className={`w-3 h-3 rounded-full ${k.dot} flex-shrink-0`} />
                <span>{k.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600">
              <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <span>Selected</span>
            </div>
          </div>

          {/* MODBL surface legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Surface Key:</span>
            {[
              { abbr: 'M', label: 'Mesial (Left)' },
              { abbr: 'O', label: 'Occlusal (Center)' },
              { abbr: 'D', label: 'Distal (Right)' },
              { abbr: 'B', label: 'Buccal / Facial (Top)' },
              { abbr: 'L', label: 'Lingual (Bottom)' },
            ].map(({ abbr, label }) => (
              <span key={abbr} className="text-[10px] text-slate-500">
                <span className="font-bold text-slate-700">{abbr}</span> = {label}
              </span>
            ))}
          </div>
        </div>

        {/* Chart grid */}
        <div className="overflow-x-auto pb-2">
          <div className="flex flex-col gap-2.5 min-w-[700px] select-none">
            <div className="flex justify-center w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FACIAL / BUCCAL ↑</span>
            </div>

            {/* Upper permanent — always visible */}
            <div className="flex justify-center gap-1 w-full">
              {upperPermanent.map(num => (
                <ToothButton key={num} num={num} surfaceMap={buildSurfaceMap(num)}
                  selectedSurfaces={selectedSurfaces} surfaceConditions={surfaceConditions}
                  onToggleSurface={toggleSurface} onToggleWhole={toggleWholeTooth} />
              ))}
            </div>

            {/* Upper temporary */}
            {showPrimary && (
              <div className="flex justify-center gap-1 w-full">
                {upperTemporary.map(num => (
                  <ToothButton key={num} num={num} surfaceMap={buildSurfaceMap(num)}
                    selectedSurfaces={selectedSurfaces} surfaceConditions={surfaceConditions}
                    onToggleSurface={toggleSurface} onToggleWhole={toggleWholeTooth} />
                ))}
              </div>
            )}

            {/* Midline */}
            <div className="flex items-center w-full relative py-0.5">
              <div className="flex-1 border-b border-dashed border-gray-300" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 bg-white">Midline</span>
              <div className="flex-1 border-b border-dashed border-gray-300" />
            </div>

            {/* Lower temporary */}
            {showPrimary && (
              <div className="flex justify-center gap-1 w-full">
                {lowerTemporary.map(num => (
                  <ToothButton key={num} num={num} surfaceMap={buildSurfaceMap(num)}
                    selectedSurfaces={selectedSurfaces} surfaceConditions={surfaceConditions}
                    onToggleSurface={toggleSurface} onToggleWhole={toggleWholeTooth} />
                ))}
              </div>
            )}

            {/* Lower permanent — always visible */}
            <div className="flex justify-center gap-1 w-full">
              {lowerPermanent.map(num => (
                <ToothButton key={num} num={num} surfaceMap={buildSurfaceMap(num)}
                  selectedSurfaces={selectedSurfaces} surfaceConditions={surfaceConditions}
                  onToggleSurface={toggleSurface} onToggleWhole={toggleWholeTooth} />
              ))}
            </div>

            <div className="flex justify-center w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">↓ LINGUAL</span>
            </div>
          </div>
        </div>

        {/* Selection summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 min-h-[52px]">
          {selectedSurfaces.size === 0 ? (
            <p className="text-xs text-slate-400">
              No surfaces selected. Click tooth numbers for whole-tooth selection, or tap individual surface zones.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                {selectedSurfaces.size} surface{selectedSurfaces.size !== 1 ? 's' : ''} across {uniqueTeethCount} {uniqueTeethCount !== 1 ? 'teeth' : 'tooth'}:
              </span>
              {selectedList.slice(0, 24).map(key => {
                const dashIdx = key.indexOf('-')
                const toothNum = key.slice(0, dashIdx)
                const surface = key.slice(dashIdx + 1)
                return (
                  <span key={key} className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-blue-50 border-blue-300 text-blue-700">
                    #{toothNum} {cap(surface)}
                  </span>
                )
              })}
              {selectedList.length > 24 && (
                <span className="text-[10px] text-slate-400 font-semibold">+{selectedList.length - 24} more</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Record condition form — dentist only */}
      {dentistId && (
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-800 text-sm">Record Tooth Condition</h4>
            <button
              type="button"
              onClick={() => setShowConditionForm(!showConditionForm)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              {showConditionForm ? 'Hide Form' : 'Record Condition'}
            </button>
          </div>

          {showConditionForm && (
            <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-150 pt-4 mt-2">
              {selectedSurfaces.size === 0 ? (
                <p className="text-xs text-amber-600 font-medium">
                  No surfaces selected — click tooth numbers or surface zones on the chart above.
                </p>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-600">
                    {selectedSurfaces.size} surface{selectedSurfaces.size !== 1 ? 's' : ''} — set condition and notes per surface:
                  </p>

                  {/* Column headers */}
                  <div className="grid grid-cols-[140px_1fr_1fr] gap-3 px-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Surface</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Condition</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Notes</span>
                  </div>

                  {/* Per-surface rows */}
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {selectedList.map(key => {
                      const dashIdx = key.indexOf('-')
                      const toothNum = key.slice(0, dashIdx)
                      const surface = key.slice(dashIdx + 1)
                      return (
                        <div key={key} className="grid grid-cols-[140px_1fr_1fr] gap-3 items-center bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-xs font-bold text-slate-700">
                            Tooth #{toothNum} —{' '}
                            <span className="font-semibold text-slate-500">{cap(surface)}</span>
                          </span>
                          <select
                            value={surfaceConditions[key] ?? 'healthy'}
                            onChange={e => setSurfaceConditions(prev => ({ ...prev, [key]: e.target.value }))}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                          >
                            {conditionKeys.map(k => (
                              <option key={k.id} value={k.id}>{k.label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Observation notes…"
                            value={surfaceNotes[key] ?? ''}
                            onChange={e => setSurfaceNotes(prev => ({ ...prev, [key]: e.target.value }))}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConditionForm(false)}
                  className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedSurfaces.size === 0}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Saving…' : 'Save Conditions & Notes'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* History table */}
      <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
        <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-1.5 mb-4 gap-2">
          <h4 className="font-bold text-slate-800 text-sm">Dental Chart History</h4>
          {(() => {
            const latestChart = (dentalCharts ?? [])[0]
            if (!latestChart) return null
            const dentistObj = Array.isArray(latestChart.dentists) ? latestChart.dentists[0] : latestChart.dentists
            const clinicObj  = Array.isArray(latestChart.clinics)  ? latestChart.clinics[0]  : latestChart.clinics
            if (!dentistObj && !clinicObj) return null
            const dentistName = dentistObj ? `Dr. ${dentistObj.first_name} ${dentistObj.last_name}` : 'Attending Dentist'
            const branchName  = clinicObj?.name ?? 'Clinic'
            const updateDate  = latestChart.updated_at ?? latestChart.created_at
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
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Affected Surfaces</th>
                <th className="px-4 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-slate-700">
              {historyGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 italic">
                    No diagnostic history recorded for this patient.
                  </td>
                </tr>
              ) : (
                historyGroups.map((group, idx) => {
                  const hasAnySurface = Object.keys(group.surfaceCondMap).length > 0
                  const isWholeTooth = !hasAnySurface && group.wholeCondition !== null

                  // Compile notes with surface prefixes
                  const noteParts: string[] = []
                  SURFACE_ORDER.forEach(s => {
                    const note = group.surfaceNoteMap[s]
                    if (note) noteParts.push(`${cap(s)}: ${note}`)
                  })
                  if (group.wholeNotes) noteParts.push(group.wholeNotes)
                  const notesText = noteParts.join('; ') || '—'

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-gray-400">{formatDate(group.recorded_at)}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">#{group.tooth_number}</td>
                      <td className="px-4 py-3 capitalize">{getToothType(group.tooth_number)}</td>
                      <td className="px-4 py-3">
                        {isWholeTooth ? (
                          // Whole-tooth condition badge spanning full cell
                          <span
                            className="inline-block w-full text-center px-2 py-0.5 rounded font-bold uppercase text-[9px] text-white"
                            style={{ backgroundColor: VIVID_FILL[group.wholeCondition ?? 'missing'] ?? '#94a3b8' }}
                          >
                            {(group.wholeCondition ?? '').replace('_', ' ')}
                          </span>
                        ) : (
                          // Per-surface MODBL badges colored by their condition
                          <div className="flex gap-1 flex-wrap">
                            {SURFACE_ORDER.map(s => {
                              const cond = group.surfaceCondMap[s]
                              if (!cond) {
                                return (
                                  <span key={s} className="px-1.5 py-0.5 text-[10px] font-bold rounded text-slate-200 bg-slate-50 border border-slate-100">
                                    {SURFACE_ABBR[s]}
                                  </span>
                                )
                              }
                              const bgColor = VIVID_FILL[cond] ?? '#94a3b8'
                              const isLight = cond === 'healthy'
                              return (
                                <span
                                  key={s}
                                  title={`${cap(s)}: ${cond.replace('_', ' ')}`}
                                  className="px-1.5 py-0.5 text-[10px] font-bold rounded"
                                  style={{
                                    backgroundColor: bgColor,
                                    color: isLight ? '#475569' : '#ffffff',
                                    border: isLight ? '1px solid #cbd5e1' : 'none',
                                  }}
                                >
                                  {SURFACE_ABBR[s]}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{notesText}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
