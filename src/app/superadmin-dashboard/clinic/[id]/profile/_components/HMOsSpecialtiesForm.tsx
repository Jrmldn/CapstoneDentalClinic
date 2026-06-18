'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2, Plus, X } from 'lucide-react'
import { manageClinicSpecialties } from '@/actions/clinicSetupActions'

interface Props {
  clinicId: number
  specialties: Record<string, unknown>[]
}

export default function HMOsSpecialtiesForm({ clinicId, specialties }: Props) {
  const [specList, setSpecList]   = useState<string[]>(specialties.map(s => String(s.specialty_name)))
  const [specInput, setSpecInput] = useState('')

  const [isPendingSpec, startSpec] = useTransition()
  const [msgSpec, setMsgSpec] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
    <div className="max-w-xl">
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
