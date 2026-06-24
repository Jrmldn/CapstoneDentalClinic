'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2, Plus, X } from 'lucide-react'
import { manageClinicHMOs, manageClinicSpecialties } from '@/actions/clinicSetupActions'

interface Props {
  clinicId: number
  hmos: Record<string, unknown>[]
  specialties: Record<string, unknown>[]
}

export default function HMOsSpecialtiesForm({ clinicId, hmos, specialties }: Props) {
  const [hmoList, setHmoList]     = useState<string[]>(hmos.map(h => String(h.hmo_name)))
  const [specList, setSpecList]   = useState<string[]>(specialties.map(s => String(s.specialty_name)))
  const [hmoInput, setHmoInput]   = useState('')
  const [specInput, setSpecInput] = useState('')

  const [isPendingHmo, startHmo]   = useTransition()
  const [isPendingSpec, startSpec] = useTransition()
  const [msgHmo, setMsgHmo]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [msgSpec, setMsgSpec] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── HMO helpers ──
  const addHmo = () => {
    const v = hmoInput.trim()
    if (v && !hmoList.includes(v)) setHmoList(p => [...p, v])
    setHmoInput('')
  }
  const removeHmo = (name: string) => setHmoList(p => p.filter(h => h !== name))

  const saveHmos = () => {
    setMsgHmo(null)
    startHmo(async () => {
      const r = await manageClinicHMOs(clinicId, hmoList)
      setMsgHmo(r.success
        ? { type: 'success', text: 'HMOs saved.' }
        : { type: 'error', text: r.error ?? 'Failed.' })
    })
  }

  // ── Specialty helpers ──
  const addSpec = () => {
    const v = specInput.trim()
    if (v && !specList.includes(v)) setSpecList(p => [...p, v])
    setSpecInput('')
  }
  const removeSpec = (name: string) => setSpecList(p => p.filter(s => s !== name))

  const saveSpecs = () => {
    setMsgSpec(null)
    startSpec(async () => {
      const r = await manageClinicSpecialties(clinicId, specList)
      setMsgSpec(r.success
        ? { type: 'success', text: 'Specialties saved.' }
        : { type: 'error', text: r.error ?? 'Failed.' })
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
      {/* HMOs */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Accepted HMOs / Health Cards</h2>

        <div className="flex gap-2">
          <input
            id="hmo-input"
            type="text"
            value={hmoInput}
            onChange={e => setHmoInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHmo())}
            placeholder="e.g. Intellicare"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            id="add-hmo-btn"
            type="button"
            onClick={addHmo}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {hmoList.map(name => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
            >
              {name}
              <button type="button" onClick={() => removeHmo(name)} className="hover:text-red-500 transition">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {hmoList.length === 0 && (
            <p className="text-xs text-gray-400">No HMOs added yet.</p>
          )}
        </div>

        {msgHmo && (
          <p className={`text-xs font-medium ${msgHmo.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {msgHmo.text}
          </p>
        )}

        <button
          id="save-hmos-btn"
          type="button"
          onClick={saveHmos}
          disabled={isPendingHmo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {isPendingHmo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPendingHmo ? 'Saving…' : 'Save HMOs'}
        </button>
      </section>

      {/* Specialties */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Clinic Specialties</h2>

        <div className="flex gap-2">
          <input
            id="specialty-input"
            type="text"
            value={specInput}
            onChange={e => setSpecInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpec())}
            placeholder="e.g. Orthodontics"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            id="add-specialty-btn"
            type="button"
            onClick={addSpec}
            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {specList.map(name => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"
            >
              {name}
              <button type="button" onClick={() => removeSpec(name)} className="hover:text-red-500 transition">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {specList.length === 0 && (
            <p className="text-xs text-gray-400">No specialties added yet.</p>
          )}
        </div>

        {msgSpec && (
          <p className={`text-xs font-medium ${msgSpec.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {msgSpec.text}
          </p>
        )}

        <button
          id="save-specialties-btn"
          type="button"
          onClick={saveSpecs}
          disabled={isPendingSpec}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition"
        >
          {isPendingSpec ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPendingSpec ? 'Saving…' : 'Save Specialties'}
        </button>
      </section>
    </div>
  )
}
