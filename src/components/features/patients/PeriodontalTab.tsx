'use client'

import { useState } from 'react'
import { Plus, X, HeartPulse, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react'
import { addPeriodontalScreening, addTmjAssessment } from '@/actions/patientActions'

export interface PeriodontalScreening {
  id: number
  screened_at: string | null
  pocket_depths: any // JSON
  bleeding_points: any // JSON
  findings: string | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

export interface TmjAssessment {
  id: number
  assessed_at: string | null
  findings: string | null
  pain_scale: number | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

interface PeriodontalTabProps {
  patientId: number
  clinicId: number
  dentistId?: number
  screenings: PeriodontalScreening[]
  tmjAssessments: TmjAssessment[]
  onRefresh: () => Promise<void>
}

export default function PeriodontalTab({
  patientId,
  clinicId,
  dentistId,
  screenings,
  tmjAssessments,
  onRefresh,
}: PeriodontalTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states - PSR
  const [pocketDepths, setPocketDepths] = useState<Record<string, number>>({
    site_1: 2, site_2: 2, site_3: 3, site_4: 2, site_5: 2,
    site_6: 2, site_7: 3, site_8: 3, site_9: 4, site_10: 3
  })
  const [bleedingPoints, setBleedingPoints] = useState<Record<string, boolean>>({
    site_1: false, site_2: false, site_3: true, site_4: false, site_5: false,
    site_6: false, site_7: true, site_8: true, site_9: true, site_10: false
  })
  const [mobility, setMobility] = useState('Grade 0')
  const [furcation, setFurcation] = useState('None detected')
  const [plaqueIndex, setPlaqueIndex] = useState('22%')

  // Form states - TMJ
  const [clicking, setClicking] = useState('Right TMJ on opening')
  const [painLevel, setPainLevel] = useState('Mild - VAS 2/10')
  const [painScale, setPainScale] = useState(2) // 0-10
  const [maxOpening, setMaxOpening] = useState('42 mm')
  const [lateralMovement, setLateralMovement] = useState('Right: 9mm, Left: 10mm')
  const [recommendedTreatment, setRecommendedTreatment] = useState('Occlusal splint therapy recommended')

  // Parse findings JSON or fallback
  const getPeriodontalFindingsObj = (findingsStr: string | null) => {
    try {
      if (findingsStr && findingsStr.startsWith('{')) {
        return JSON.parse(findingsStr)
      }
    } catch (e) {}
    return { mobility: findingsStr || 'Grade 0', furcation: 'None detected', plaque_index: '—' }
  }

  const getTmjFindingsObj = (findingsStr: string | null) => {
    try {
      if (findingsStr && findingsStr.startsWith('{')) {
        return JSON.parse(findingsStr)
      }
    } catch (e) {}
    return {
      clicking: findingsStr || 'None',
      pain_level: '—',
      max_opening: '—',
      lateral_movement: '—',
      recommended_treatment: '—'
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // 1. Save Periodontal Screening
    const periodontalFindings = JSON.stringify({
      mobility,
      furcation,
      plaque_index: plaqueIndex
    })

    const periodontalRes = await addPeriodontalScreening({
      patient_id: patientId,
      clinic_id: clinicId,
      dentist_id: dentistId || 0,
      pocket_depths: pocketDepths,
      bleeding_points: bleedingPoints,
      findings: periodontalFindings
    })

    // 2. Save TMJ Assessment
    const tmjFindings = JSON.stringify({
      clicking,
      pain_level: painLevel,
      max_opening: maxOpening,
      lateral_movement: lateralMovement,
      recommended_treatment: recommendedTreatment
    })

    const tmjRes = await addTmjAssessment({
      patient_id: patientId,
      clinic_id: clinicId,
      dentist_id: dentistId || 0,
      findings: tmjFindings,
      pain_scale: painScale
    })

    setIsSubmitting(false)

    if (periodontalRes.success && tmjRes.success) {
      alert('Periodontal and TMJ records saved successfully!')
      setShowForm(false)
      await onRefresh()
    } else {
      alert('Failed to save some records. Check details.')
    }
  }

  // Get active/latest screening for display
  const latestScreening = screenings[0]
  const latestTmj = tmjAssessments[0]

  const displayPocketDepths = latestScreening?.pocket_depths || pocketDepths
  const displayBleedingPoints = latestScreening?.bleeding_points || bleedingPoints
  const periodontalFindings = getPeriodontalFindingsObj(latestScreening?.findings)
  const tmjFindings = getTmjFindingsObj(latestTmj?.findings)

  // Helper for pocket depth badge style
  const getPocketDepthBadgeClass = (depth: number) => {
    if (depth <= 2) return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    if (depth === 3) return 'bg-amber-50 text-amber-700 border border-amber-200'
    return 'bg-rose-50 text-rose-700 border border-rose-200'
  }

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Periodontal &amp; TMJ Screening</h4>
          <p className="text-xs text-gray-500 mt-0.5">Record pocket depths, bleeding indices, and jaw joint movement.</p>
        </div>
        {dentistId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancel' : 'New Screening'}
          </button>
        )}
      </div>

      {/* Entry Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-250/60 shadow-xs space-y-6 animate-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="font-bold text-slate-850 text-xs uppercase tracking-wider">New Periodontal &amp; TMJ Record</span>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* PSR Inputs */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-1">Periodontal Screening (PSR)</h5>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, idx) => {
                const siteKey = `site_${idx + 1}`
                return (
                  <div key={siteKey} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Site {idx + 1}</span>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 block">Depth (mm)</label>
                      <select
                        className="w-full text-center px-1.5 py-1 border border-gray-200 rounded text-xs bg-white"
                        value={pocketDepths[siteKey]}
                        onChange={e => setPocketDepths(prev => ({ ...prev, [siteKey]: parseInt(e.target.value) }))}
                      >
                        <option value="1">1 mm</option>
                        <option value="2">2 mm</option>
                        <option value="3">3 mm</option>
                        <option value="4">4 mm</option>
                        <option value="5">5 mm</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 pt-1.5 border-t border-gray-150">
                      <span className="text-[9px] font-bold text-slate-500">Bleed</span>
                      <input
                        type="checkbox"
                        checked={bleedingPoints[siteKey]}
                        onChange={e => setBleedingPoints(prev => ({ ...prev, [siteKey]: e.target.checked }))}
                        className="w-3.5 h-3.5 border border-gray-300 rounded accent-red-650"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Mobility</label>
                <select
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white"
                  value={mobility}
                  onChange={e => setMobility(e.target.value)}
                >
                  <option value="Grade 0">Grade 0 (Healthy)</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3 (Severe)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Furcation</label>
                <select
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white"
                  value={furcation}
                  onChange={e => setFurcation(e.target.value)}
                >
                  <option value="None detected">None detected</option>
                  <option value="Class I">Class I</option>
                  <option value="Class II">Class II</option>
                  <option value="Class III">Class III</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Plaque Index (%)</label>
                <input
                  type="text"
                  placeholder="e.g. 22%"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white"
                  value={plaqueIndex}
                  onChange={e => setPlaqueIndex(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TMJ Inputs */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h5 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-1">TMJ Assessment</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Clicking / Crepitus</label>
                <input
                  type="text"
                  placeholder="e.g. Right TMJ on opening"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white"
                  value={clicking}
                  onChange={e => setClicking(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pain Level (VAS 0-10) *</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    className="flex-1 accent-blue-600"
                    value={painScale}
                    onChange={e => {
                      const val = parseInt(e.target.value)
                      setPainScale(val)
                      setPainLevel(val === 0 ? 'None' : val <= 3 ? `Mild - VAS ${val}/10` : val <= 7 ? `Moderate - VAS ${val}/10` : `Severe - VAS ${val}/10`)
                    }}
                  />
                  <span className="text-xs font-bold text-slate-800 w-28 text-right bg-slate-100 px-2.5 py-1 rounded border border-gray-200">
                    {painLevel}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Max Opening (mm)</label>
                <input
                  type="text"
                  placeholder="e.g. 42 mm"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white"
                  value={maxOpening}
                  onChange={e => setMaxOpening(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Lateral Movement (mm)</label>
                <input
                  type="text"
                  placeholder="e.g. Right: 9mm, Left: 10mm"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white"
                  value={lateralMovement}
                  onChange={e => setLateralMovement(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Recommended Treatment</label>
              <input
                type="text"
                placeholder="e.g. Occlusal splint therapy recommended"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white"
                value={recommendedTreatment}
                onChange={e => setRecommendedTreatment(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-slate-600 rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      )}

      {/* Periodontal Visual Screen View (matching periodontal.png) */}
      <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-xs space-y-6">
        {/* PSR section */}
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Periodontal Screening (PSR)</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {latestScreening?.screened_at 
              ? `Last screening: ${new Date(latestScreening.screened_at).toLocaleDateString()}` 
              : 'Default baseline representation'}
          </p>
        </div>

        {/* Site Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-150 text-slate-500 font-bold">
                <th className="px-4 py-2.5">Site</th>
                <th className="px-4 py-2.5">Pocket Depth (mm)</th>
                <th className="px-4 py-2.5">Bleeding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-slate-700">
              {Array.from({ length: 10 }).map((_, idx) => {
                const siteKey = `site_${idx + 1}`
                const depth = (displayPocketDepths as any)?.[siteKey] ?? 2
                const isBleeding = (displayBleedingPoints as any)?.[siteKey] ?? false
                return (
                  <tr key={siteKey} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 text-slate-600 font-semibold">Site {idx + 1}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${getPocketDepthBadgeClass(depth)}`}>
                        {depth}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {isBleeding ? (
                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-red-500 inline-block align-middle" title="Bleeding Detected" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-teal-500 inline-block align-middle" title="No Bleeding" />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* PSR card stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-gray-150 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-semibold block uppercase">Mobility</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">{periodontalFindings.mobility}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-gray-150 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-semibold block uppercase">Furcation</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">{periodontalFindings.furcation}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-gray-150 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-semibold block uppercase">Plaque Index</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">{periodontalFindings.plaque_index}</span>
          </div>
        </div>

        {/* TMJ section */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">TMJ Assessment</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {latestTmj?.assessed_at
                ? `Last assessed: ${new Date(latestTmj.assessed_at).toLocaleDateString()}`
                : 'Default baseline representation'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-gray-150 shadow-2xs">
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Clicking</span>
              <span className="text-xs font-bold text-slate-800 mt-1 block">{tmjFindings.clicking}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-gray-150 shadow-2xs">
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Pain Level</span>
              <span className="text-xs font-bold text-slate-800 mt-1 block">{tmjFindings.pain_level}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-gray-150 shadow-2xs">
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Max Opening</span>
              <span className="text-xs font-bold text-slate-800 mt-1 block">{tmjFindings.max_opening}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-gray-150 shadow-2xs">
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Lateral Movement</span>
              <span className="text-xs font-bold text-slate-800 mt-1 block">{tmjFindings.lateral_movement}</span>
            </div>
          </div>

          {/* Recommended treatment */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 flex flex-col gap-1">
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Recommended Treatment</span>
            <span className="text-xs font-semibold text-amber-900">{tmjFindings.recommended_treatment}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
