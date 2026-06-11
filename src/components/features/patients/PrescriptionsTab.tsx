'use client'

import { useState } from 'react'
import { Plus, X, ClipboardCheck, Pill } from 'lucide-react'
import { addPrescription } from '@/actions/patientActions'

export interface Prescription {
  id: number
  prescribed_at: string | null
  medication: string
  dosage: string
  frequency: string
  duration: string | null
  notes?: string | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

interface PrescriptionsTabProps {
  patientId: number
  clinicId: number
  dentistId?: number
  prescriptions: Prescription[]
  onRefresh: () => Promise<void>
}

export default function PrescriptionsTab({
  patientId,
  clinicId,
  dentistId,
  prescriptions,
  onRefresh,
}: PrescriptionsTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [medication, setMedication] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medication || !dosage || !frequency) {
      alert('Please fill in required fields.')
      return
    }

    setIsSubmitting(true)
    const res = await addPrescription({
      patient_id: patientId,
      clinic_id: clinicId,
      dentist_id: dentistId || 0,
      medication,
      dosage,
      frequency,
      duration: duration || null,
      notes: notes || null,
    })
    setIsSubmitting(false)

    if (res.success) {
      setMedication('')
      setDosage('')
      setFrequency('')
      setDuration('')
      setNotes('')
      setShowForm(false)
      await onRefresh()
    } else {
      alert(res.error || 'Failed to save prescription')
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Prescriptions</h4>
          <p className="text-xs text-gray-500 mt-0.5">Manage medications and dosage schedules for this patient.</p>
        </div>
        {dentistId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancel' : 'New Prescription'}
          </button>
        )}
      </div>

      {/* New Prescription Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-5 rounded-xl border border-gray-250/60 shadow-xs space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">New Prescription</span>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-650">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Drug Name &amp; Dosage *</label>
              <input
                type="text"
                placeholder="e.g. Amoxicillin 500mg"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                value={medication}
                onChange={e => setMedication(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Sig (Instructions) *</label>
              <input
                type="text"
                placeholder="e.g. 1 cap TID (three times a day)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Frequency *</label>
              <input
                type="text"
                placeholder="e.g. Every 8 hours"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Duration</label>
              <input
                type="text"
                placeholder="e.g. 7 days"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Take after meals, complete the full course"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
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
              {isSubmitting ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </form>
      )}

      {/* Prescription List */}
      <div className="space-y-3">
        {prescriptions.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-xl border border-gray-150 shadow-xs">
            <Pill className="w-8 h-8 text-gray-300 mx-auto mb-2.5" />
            <p className="text-xs text-gray-400">No prescriptions recorded for this patient.</p>
          </div>
        ) : (
          prescriptions.map((pres) => {
            const dentistObj = Array.isArray(pres.dentists) ? pres.dentists[0] : pres.dentists
            const prescribedDate = pres.prescribed_at
              ? new Date(pres.prescribed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '—'

            // Determine active/completed status (e.g. active if within 7 days, or by parsing duration)
            const isCompleted = pres.duration?.toLowerCase().includes('completed') || 
                                pres.notes?.toLowerCase().includes('completed') || 
                                (pres.prescribed_at && (new Date().getTime() - new Date(pres.prescribed_at).getTime()) > 30 * 24 * 60 * 60 * 1000)

            return (
              <div
                key={pres.id}
                className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex items-center justify-between hover:shadow-sm transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Pill className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-slate-800 text-sm">{pres.medication}</h5>
                    <p className="text-xs text-slate-600">
                      {pres.dosage} · {pres.frequency} {pres.duration ? `· ${pres.duration}` : ''}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-gray-400 font-semibold">{prescribedDate}</span>
                      {dentistObj && (
                        <span className="text-[10px] text-gray-450">
                          · Dr. {dentistObj.first_name} {dentistObj.last_name}
                        </span>
                      )}
                    </div>
                    {pres.notes && (
                      <p className="text-[11px] text-gray-500 italic mt-1 bg-slate-50 px-2 py-0.5 rounded border border-gray-100 w-fit">
                        Note: {pres.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-slate-100 text-slate-500 border border-slate-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {isCompleted ? 'completed' : 'active'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
