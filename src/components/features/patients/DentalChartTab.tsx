'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X } from 'lucide-react'
import type { DentalChart, ToothCondition, PeriodontalFinding } from './types'
import { updateDentalChart, ToothConditionData } from '@/actions/dentalChartActions'
import { addPeriodontalFindings } from '@/actions/periodontalFindingsActions'
import { formatDateTime } from '@/lib/date'
import PeriodontalFindingsSection, {
  PERIODONTAL_FINDING_LABELS,
  CATEGORY_TITLES,
  type PeriodontalFindingsInput,
  type PeriodontalFindingsCategory,
} from './PeriodontalFindingsSection'

export interface StagedConditionDisplay extends ToothCondition {
  dentistName: string
  clinicName: string
  dental_chart_id: number
}

export interface SessionGroup {
  dateKey: string
  recorded_at: string
  dental_chart_id: number
  toothNumbers: number[]
  conditionSummary: Record<string, number>
  conditions: StagedConditionDisplay[]
  dentistName: string
  clinicName: string
}

interface DentalChartTabProps {
  patientId: number
  clinicId: number
  dentalCharts: DentalChart[]
  dentistId?: number
  onRefresh: () => Promise<void>
  readOnly?: boolean
  historyOnly?: boolean
  onChartSave?: (conditions: ToothConditionData[]) => void
  stagedConditions?: ToothConditionData[]
  periodontalFindings?: PeriodontalFinding[]
  onFindingsSave?: (data: PeriodontalFindingsInput) => void
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
  readOnly?: boolean
}

function ToothSvg({ num, surfaceMap, selectedSurfaces, surfaceConditions, onToggleSurface, readOnly = false }: ToothSvgProps) {
  const overallCond = Object.values(surfaceMap).find(c => c !== 'healthy') ?? 'healthy'
  const ringStroke = RING_COLOR[overallCond] ?? '#cbd5e1'

  return (
    <svg viewBox="0 0 40 40" className="w-full h-auto block">
      {/* 4 outer surface sectors */}
      {OUTER_SURFACES.map(({ name, a1, a2 }) => {
        const key = `${num}-${name}`
        const isSelected = selectedSurfaces.has(key)
        const fill = getLiveFill(key, surfaceMap[name] ?? 'healthy', selectedSurfaces, surfaceConditions)
        const effectiveCond = isSelected ? (surfaceConditions[key] ?? 'selected') : (surfaceMap[name] ?? 'healthy')
        return (
          <g key={name} onClick={readOnly ? undefined : () => onToggleSurface(num, name)} style={{ cursor: readOnly ? 'default' : 'pointer' }}>
            <title>Tooth #{num} — {cap(name)} ({effectiveCond})</title>
            <path
              d={donutPath(CX, CY, INNER, OUTER, a1, a2)}
              fill={fill}
              stroke={isSelected ? '#3b82f6' : 'none'}
              strokeWidth={isSelected ? '2' : '0'}
              className={readOnly ? "" : "transition-opacity hover:opacity-80"}
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
          <g onClick={readOnly ? undefined : () => onToggleSurface(num, 'occlusal')} style={{ cursor: readOnly ? 'default' : 'pointer' }}>
            <title>Tooth #{num} — Occlusal ({effectiveCond})</title>
            <circle
              cx={CX} cy={CY} r={INNER}
              fill={fill}
              stroke={isSelected ? '#3b82f6' : 'none'}
              strokeWidth={isSelected ? '2' : '0'}
              className={readOnly ? "" : "transition-opacity hover:opacity-80"}
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
  readOnly?: boolean
}

function ToothButton({ num, surfaceMap, selectedSurfaces, surfaceConditions, onToggleSurface, onToggleWhole, readOnly = false }: ToothButtonProps) {
  const hasAllSelected = ALL_SURFACE_NAMES.every(s => selectedSurfaces.has(`${num}-${s}`))
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0 max-w-[40px]">
      <button
        type="button"
        onClick={readOnly ? undefined : () => onToggleWhole(num)}
        disabled={readOnly}
        title={readOnly ? `Tooth #${num}` : "Click to select / deselect all surfaces"}
        className={`text-[10px] font-bold transition underline-offset-2 leading-none ${
          readOnly
            ? 'text-slate-600 cursor-default'
            : hasAllSelected
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
        readOnly={readOnly}
      />
    </div>
  )
}



const EMPTY_CONDITIONS: ToothConditionData[] = []
const EMPTY_FINDINGS: PeriodontalFinding[] = []
const emptyFindingsInput: PeriodontalFindingsInput = {
  gingivitis: [],
  periodontal_condition: [],
  occlusion: [],
  appliances: [],
}
const FINDING_CATEGORIES: PeriodontalFindingsCategory[] = ['gingivitis', 'periodontal_condition', 'occlusion', 'appliances']

export default function DentalChartTab({
  patientId,
  clinicId,
  dentalCharts,
  dentistId,
  onRefresh,
  readOnly = false,
  historyOnly = false,
  onChartSave,
  stagedConditions = EMPTY_CONDITIONS,
  periodontalFindings = EMPTY_FINDINGS,
  onFindingsSave,
}: DentalChartTabProps) {
  const [showPrimary, setShowPrimary] = useState(true)
  const [selectedSurfaces, setSelectedSurfaces] = useState<Set<string>>(new Set())
  const [surfaceConditions, setSurfaceConditions] = useState<Record<string, string>>({})
  const [surfaceNotes, setSurfaceNotes] = useState<Record<string, string>>({})
  const [showConditionForm, setShowConditionForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewingSession, setViewingSession] = useState<SessionGroup | null>(null)
  const [findings, setFindings] = useState<PeriodontalFindingsInput>(emptyFindingsInput)

  // Load staged conditions into local form state
  useEffect(() => {
    if (stagedConditions && stagedConditions.length > 0) {
      const conds: Record<string, string> = {}
      const nts: Record<string, string> = {}
      const activeKeys = new Set<string>()
      stagedConditions.forEach(c => {
        if (c.surface) {
          const key = `${c.tooth_number}-${c.surface}`
          conds[key] = c.condition
          if (c.notes) nts[key] = c.notes
          activeKeys.add(key)
        }
      })
      setSurfaceConditions(prev => ({ ...prev, ...conds }))
      setSurfaceNotes(prev => ({ ...prev, ...nts }))
      setSelectedSurfaces(prev => {
        const merged = new Set(prev)
        activeKeys.forEach(k => merged.add(k))
        return merged
      })
    } else if (stagedConditions && stagedConditions.length === 0) {
      setSelectedSurfaces(new Set())
      setSurfaceConditions({})
      setSurfaceNotes({})
    }
  }, [stagedConditions])

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

  // Merge any staged conditions from parent modal
  ;(stagedConditions ?? []).forEach(cond => {
    if (cond.surface) {
      const key = `${cond.tooth_number}-${cond.surface}`
      surfaceConditionsMap[key] = { condition: cond.condition, recorded_at: new Date().toISOString() }
    } else {
      toothWideMap[cond.tooth_number] = cond.condition
    }
  })

  function buildSurfaceMap(num: number): Record<string, string> {
    return Object.fromEntries(
      ALL_SURFACE_NAMES.map(s => [
        s,
        surfaceConditionsMap[`${num}-${s}`]?.condition ?? toothWideMap[num] ?? 'healthy',
      ])
    )
  }



  const handleConditionChange = (key: string, value: string) => {
    setSurfaceConditions(prev => ({ ...prev, [key]: value }))
  }

  const handleNotesChange = (key: string, value: string) => {
    setSurfaceNotes(prev => ({ ...prev, [key]: value }))
  }

  function toggleSurface(num: number, surface: string) {
    const key = `${num}-${surface}`
    setShowConditionForm(true)
    setSelectedSurfaces(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        setSurfaceConditions(curr => {
          const updated = { ...curr }
          delete updated[key]
          return updated
        })
      } else {
        next.add(key)
        setSurfaceConditions(curr => {
          const updated = { ...curr }
          if (!updated[key]) updated[key] = 'decayed'
          return updated
        })
      }
      return next
    })
  }

  function toggleWholeTooth(num: number) {
    const keys = ALL_SURFACE_NAMES.map(s => `${num}-${s}`)
    const allSelected = keys.every(k => selectedSurfaces.has(k))
    setShowConditionForm(true)
    setSelectedSurfaces(prev => {
      const next = new Set(prev)
      setSurfaceConditions(curr => {
        const updated = { ...curr }
        if (allSelected) {
          keys.forEach(k => {
            next.delete(k)
            delete updated[k]
          })
        } else {
          keys.forEach(k => {
            next.add(k)
            if (!updated[k]) updated[k] = 'decayed'
          })
        }
        return updated
      })
      return next
    })
  }


  const hasAnyFinding = FINDING_CATEGORIES.some(cat => findings[cat].length > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dentistId || (selectedSurfaces.size === 0 && !hasAnyFinding)) return
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

    if (onChartSave) {
      onChartSave(conditionsData)
      if (onFindingsSave) onFindingsSave(findings)
      setIsSubmitting(false)
      return
    }

    const res = await updateDentalChart(patientId, clinicId, dentistId, conditionsData)
    if (!res.success) {
      setIsSubmitting(false)
      alert(res.error ?? 'Failed to update dental chart')
      return
    }

    if (hasAnyFinding) {
      const findingsRes = await addPeriodontalFindings({
        patient_id: patientId,
        clinic_id: clinicId,
        dentist_id: dentistId,
        appointment_id: null,
        dental_chart_id: res.chartId ?? null,
        ...findings,
      })
      if (!findingsRes.success) {
        console.error('Failed to save periodontal findings:', findingsRes.error)
      }
    }

    setIsSubmitting(false)
    alert('Dental chart updated successfully!')
    setSurfaceConditions({})
    setSurfaceNotes({})
    setFindings(emptyFindingsInput)
    setShowConditionForm(false)
    setSelectedSurfaces(new Set())
    await onRefresh()
  }

  // Map parent chart's dentist/clinic to each condition for displaying in history
  const allConds = (dentalCharts ?? []).flatMap(c =>
    (c.tooth_conditions ?? []).map(tc => {
      const dentistObj = Array.isArray(c.dentists) ? c.dentists[0] : c.dentists
      const dentistName = dentistObj ? `Dr. ${dentistObj.first_name} ${dentistObj.last_name}` : 'Attending Dentist'
      return {
        ...tc,
        dentistName,
        clinicName: (Array.isArray(c.clinics) ? c.clinics[0] : c.clinics)?.name || 'Clinic',
        dental_chart_id: c.id,
      }
    })
  )

  const sessionMap = new Map<number, SessionGroup>()

  allConds.forEach(cond => {
    let group = sessionMap.get(cond.dental_chart_id)
    if (!group) {
      const timestampKey = cond.recorded_at || new Date().toISOString()
      group = {
        dateKey: new Date(timestampKey).toISOString().split('T')[0] ?? '',
        recorded_at: timestampKey,
        dental_chart_id: cond.dental_chart_id,
        toothNumbers: [],
        conditionSummary: {},
        conditions: [],
        dentistName: cond.dentistName,
        clinicName: cond.clinicName
      }
      sessionMap.set(cond.dental_chart_id, group)
    }

    if (!group.toothNumbers.includes(cond.tooth_number)) {
      group.toothNumbers.push(cond.tooth_number)
    }

    group.conditionSummary[cond.condition] = (group.conditionSummary[cond.condition] || 0) + 1
    group.conditions.push(cond)
  })
  const historyGroups = Array.from(sessionMap.values())
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())

  const selectedList = Array.from(selectedSurfaces)
  const uniqueTeethCount = new Set(selectedList.map(k => k.split('-')[0])).size

  return (
    <div className="space-y-6">
      {/* Main chart panel (hidden in historyOnly mode) */}
      {!historyOnly && (
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
                  onClick={() => {
                    setSelectedSurfaces(new Set())
                    setSurfaceConditions({})
                    setSurfaceNotes({})
                    if (onChartSave) onChartSave([])
                  }}
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
            </div>

            {/* Selection indicators */}
            {selectedSurfaces.size > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center bg-blue-50/40 p-2.5 rounded-xl border border-blue-100">
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

          {/* Chart grid */}
          <div className="pb-2 w-full">
            <div className="flex flex-col gap-2.5 w-full select-none">
              <div className="flex justify-center w-full">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FACIAL / BUCCAL ↑</span>
              </div>

              {/* Upper Permanent */}
              <div className="flex justify-center gap-0.5 sm:gap-1 w-full">
                {upperPermanent.map(num => (
                  <ToothButton
                    key={num} num={num} surfaceMap={buildSurfaceMap(num)}
                    selectedSurfaces={selectedSurfaces} surfaceConditions={surfaceConditions}
                    onToggleSurface={toggleSurface} onToggleWhole={toggleWholeTooth} readOnly={readOnly}
                  />
                ))}
              </div>

              {/* Upper Temporary */}
              {showPrimary && (
                <div className="flex justify-center gap-0.5 sm:gap-1 w-full">
                  {upperTemporary.map(num => (
                    <ToothButton
                      key={num} num={num} surfaceMap={buildSurfaceMap(num)}
                      selectedSurfaces={selectedSurfaces} surfaceConditions={surfaceConditions}
                      onToggleSurface={toggleSurface} onToggleWhole={toggleWholeTooth} readOnly={readOnly}
                    />
                  ))}
                </div>
              )}

              {/* Midline horizontal divider */}
              <div className="flex items-center w-full relative py-0.5">
                <div className="flex-1 border-b border-dashed border-gray-300" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 bg-white">Midline</span>
                <div className="flex-1 border-b border-dashed border-gray-300" />
              </div>

              {/* Lower Temporary */}
              {showPrimary && (
                <div className="flex justify-center gap-0.5 sm:gap-1 w-full">
                  {lowerTemporary.map(num => (
                    <ToothButton
                      key={num} num={num} surfaceMap={buildSurfaceMap(num)}
                      selectedSurfaces={selectedSurfaces} surfaceConditions={surfaceConditions}
                      onToggleSurface={toggleSurface} onToggleWhole={toggleWholeTooth} readOnly={readOnly}
                    />
                  ))}
                </div>
              )}

              {/* Lower Permanent */}
              <div className="flex justify-center gap-0.5 sm:gap-1 w-full">
                {lowerPermanent.map(num => (
                  <ToothButton
                    key={num} num={num} surfaceMap={buildSurfaceMap(num)}
                    selectedSurfaces={selectedSurfaces} surfaceConditions={surfaceConditions}
                    onToggleSurface={toggleSurface} onToggleWhole={toggleWholeTooth} readOnly={readOnly}
                  />
                ))}
              </div>

              <div className="flex justify-center w-full">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">↓ LINGUAL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record condition form — dentist only (hidden in historyOnly mode) */}
      {!historyOnly && !readOnly && dentistId && (
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
                            onChange={e => handleConditionChange(key, e.target.value)}
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
                            onChange={e => handleNotesChange(key, e.target.value)}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Periodontal findings — optional, merged into the same submit */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periodontal Findings</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <PeriodontalFindingsSection value={findings} onChange={setFindings} />

              <div className="flex justify-between items-center pt-1">
                <div />
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowConditionForm(false)}
                    className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  {onChartSave ? (
                    (() => {
                      const hasNonHealthy = Array.from(selectedSurfaces).some(
                        key => (surfaceConditions[key] ?? 'healthy') !== 'healthy'
                      )
                      return (
                        <button
                          type="submit"
                          disabled={selectedSurfaces.size === 0 && !hasAnyFinding}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                        >
                          {hasNonHealthy ? 'Add to Invoice' : 'Add to Session'}
                        </button>
                      )
                    })()
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || (selectedSurfaces.size === 0 && !hasAnyFinding)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                    >
                      {isSubmitting ? 'Saving…' : 'Save Conditions & Notes'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* History table — hidden when rendered inside the session workspace */}
      {!onChartSave && (
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
                <th className="px-4 py-2.5">Date &amp; Time</th>
                <th className="px-4 py-2.5">Dentist</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-slate-700">
              {historyGroups.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-400 italic">
                    No diagnostic history recorded for this patient.
                  </td>
                </tr>
              ) : (
                historyGroups.map((group, idx) => {

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatDateTime(group.recorded_at)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{group.dentistName} ({group.clinicName})</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingSession(group)}
                          className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 transition"
                        >
                          View Snapshot
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {viewingSession && (
        <ChartSessionViewModal
          session={viewingSession}
          allConditions={allConds}
          periodontalFindings={periodontalFindings}
          onClose={() => setViewingSession(null)}
        />
      )}
    </div>
  )
}

interface ChartSessionViewModalProps {
  session: {
    dateKey: string
    recorded_at: string
    dental_chart_id: number
    dentistName: string
    clinicName: string
  }
  allConditions: ToothCondition[]
  periodontalFindings: PeriodontalFinding[]
  onClose: () => void
}

function ChartSessionViewModal({ session, allConditions, periodontalFindings, onClose }: ChartSessionViewModalProps) {
  const [showPrimary, setShowPrimary] = useState(true)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  // Reconstruct surface map and tooth map as of this session's timestamp
  const snapshotConditionsMap: Record<string, { condition: string; recorded_at: string }> = {}
  const toothWideMap: Record<number, string> = {}

  allConditions
    .filter(cond => {
      return cond.recorded_at <= session.recorded_at
    })
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .forEach(cond => {
      if (cond.surface) {
        snapshotConditionsMap[`${cond.tooth_number}-${cond.surface}`] = {
          condition: cond.condition,
          recorded_at: cond.recorded_at,
        }
      } else {
        toothWideMap[cond.tooth_number] = cond.condition
      }
    })

  function buildSnapshotSurfaceMap(num: number): Record<string, string> {
    return Object.fromEntries(
      ALL_SURFACE_NAMES.map(s => [
        s,
        snapshotConditionsMap[`${num}-${s}`]?.condition ?? toothWideMap[num] ?? 'healthy',
      ])
    )
  }

  const sessionFinding = periodontalFindings.find(f => f.dental_chart_id === session.dental_chart_id)
  const hasFindings = sessionFinding && FINDING_CATEGORIES.some(cat => sessionFinding[cat].length > 0)

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Dental Chart Snapshot — {formatDateTime(session.recorded_at)}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Recorded by {session.dentistName} ({session.clinicName})</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-xs space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">FDI Tooth Chart View</span>
              <button
                type="button"
                onClick={() => setShowPrimary(v => !v)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition border border-gray-200/60"
              >
                {showPrimary ? 'Hide Primary Teeth' : 'Show Primary Teeth'}
              </button>
            </div>

            {/* Condition key */}
            <div className="flex flex-wrap gap-3 bg-slate-50 p-3.5 rounded-xl border border-gray-150">
              {conditionKeys.map(k => (
                <div key={k.id} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <span className={`w-2.5 h-2.5 rounded-full ${k.dot} flex-shrink-0`} />
                  <span>{k.label}</span>
                </div>
              ))}
            </div>

            {/* Chart grid */}
            <div className="overflow-x-auto pb-2">
              <div className="flex flex-col gap-2.5 min-w-[700px] select-none">
                <div className="flex justify-center w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FACIAL / BUCCAL ↑</span>
                </div>

                <div className="flex justify-center gap-1 w-full">
                  {upperPermanent.map(num => (
                    <ToothButton
                      key={num} num={num} surfaceMap={buildSnapshotSurfaceMap(num)}
                      selectedSurfaces={new Set()} surfaceConditions={{}}
                      onToggleSurface={() => {}} onToggleWhole={() => {}} readOnly={true}
                    />
                  ))}
                </div>

                {showPrimary && (
                  <div className="flex justify-center gap-1 w-full">
                    {upperTemporary.map(num => (
                      <ToothButton
                        key={num} num={num} surfaceMap={buildSnapshotSurfaceMap(num)}
                        selectedSurfaces={new Set()} surfaceConditions={{}}
                        onToggleSurface={() => {}} onToggleWhole={() => {}} readOnly={true}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center w-full relative py-0.5">
                  <div className="flex-1 border-b border-dashed border-gray-300" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 bg-white">Midline</span>
                  <div className="flex-1 border-b border-dashed border-gray-300" />
                </div>

                {showPrimary && (
                  <div className="flex justify-center gap-1 w-full">
                    {lowerTemporary.map(num => (
                      <ToothButton
                        key={num} num={num} surfaceMap={buildSnapshotSurfaceMap(num)}
                        selectedSurfaces={new Set()} surfaceConditions={{}}
                        onToggleSurface={() => {}} onToggleWhole={() => {}} readOnly={true}
                      />
                    ))}
                  </div>
                )}

                <div className="flex justify-center gap-1 w-full">
                  {lowerPermanent.map(num => (
                    <ToothButton
                      key={num} num={num} surfaceMap={buildSnapshotSurfaceMap(num)}
                      selectedSurfaces={new Set()} surfaceConditions={{}}
                      onToggleSurface={() => {}} onToggleWhole={() => {}} readOnly={true}
                    />
                  ))}
                </div>

                <div className="flex justify-center w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">↓ LINGUAL</span>
                </div>
              </div>
            </div>

            {/* Periodontal findings divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periodontal Findings</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            {!hasFindings ? (
              <p className="text-center py-6 text-gray-400 italic text-xs">No periodontal findings recorded for this session.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FINDING_CATEGORIES.map(cat => (
                  sessionFinding![cat].length > 0 && (
                    <div key={cat}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">{CATEGORY_TITLES[cat]}</span>
                      <div className="flex flex-wrap gap-1">
                        {sessionFinding![cat].map(key => (
                          <span key={key} className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                            {PERIODONTAL_FINDING_LABELS[key] ?? key}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-xs"
          >
            Close Snapshot
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
