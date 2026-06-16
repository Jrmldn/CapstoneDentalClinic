'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X, ClipboardCheck, Pill, Printer } from 'lucide-react'
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

export interface PatientInfo {
  first_name: string
  last_name: string
  birthdate?: string
  gender?: string
}

interface PrescriptionsTabProps {
  patientId: number
  clinicId: number
  dentistId?: number
  prescriptions: Prescription[]
  onRefresh: () => Promise<void>
  patient?: PatientInfo
}

export default function PrescriptionsTab({
  patientId,
  clinicId,
  dentistId,
  prescriptions,
  onRefresh,
  patient,
}: PrescriptionsTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [medication, setMedication] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Patient'

  const printContent = (
    <div
      className="rx-print-area"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        visibility: 'hidden',
        pointerEvents: 'none',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#1e293b',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #1d4ed8', paddingBottom: '18px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1d4ed8' }}>Dental Clinic</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Patient Prescription Record</div>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
          <strong>Date:</strong> {today}
        </div>
      </div>

      {/* Patient banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#1e40af' }}>{patientName}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {patient?.birthdate ? `DOB: ${patient.birthdate}` : ''}
            {patient?.gender ? ` · ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}` : ''}
          </div>
        </div>
        <div style={{ background: '#1d4ed8', color: '#fff', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: 700 }}>
          {prescriptions.length} Prescription{prescriptions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Section label */}
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '12px' }}>
        Medications
      </div>

      {/* Rx cards */}
      {prescriptions.map((pres, i) => {
        const dentist = Array.isArray(pres.dentists) ? pres.dentists[0] : pres.dentists
        const date = pres.prescribed_at
          ? new Date(pres.prescribed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : '—'
        return (
          <div key={pres.id} style={{ display: 'flex', gap: '14px', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
            <div style={{ width: '26px', height: '26px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>
              {i + 1}
            </div>
            <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
              <div style={{ fontSize: '28px', color: '#1d4ed8', fontWeight: 300, lineHeight: 1, flexShrink: 0 }}>℞</div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '5px' }}>{pres.medication}</p>
                <p style={{ fontSize: '12px', color: '#334155', marginBottom: '3px' }}><strong>Sig:</strong> {pres.dosage}</p>
                <p style={{ fontSize: '12px', color: '#334155', marginBottom: '3px' }}>
                  <strong>Frequency:</strong> {pres.frequency}
                  {pres.duration ? <> &nbsp;·&nbsp; <strong>Duration:</strong> {pres.duration}</> : null}
                </p>
                {pres.notes && (
                  <p style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px 8px', margin: '6px 0 4px' }}>
                    <em>Note: {pres.notes}</em>
                  </p>
                )}
                <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                  Prescribed: {date}
                  {dentist ? ` · Dr. ${dentist.first_name} ${dentist.last_name}` : ''}
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {/* Footer */}
      <div style={{ marginTop: '36px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: '10px', color: '#94a3b8', maxWidth: '340px' }}>
          Generated from the clinic&apos;s electronic health record system. Follow the prescribed dosage and consult your dentist with any questions.
        </div>
        <div>
          <div style={{ width: '180px', borderTop: '1.5px solid #334155', marginBottom: '4px' }} />
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Dentist&apos;s Signature</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Portal: renders rx-print-area as direct body child for clean print isolation */}
      {mounted && createPortal(printContent, document.body)}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Prescriptions</h4>
          <p className="text-xs text-gray-500 mt-0.5">Manage medications and dosage schedules for this patient.</p>
        </div>
        <div className="flex items-center gap-2">
          {prescriptions.length > 0 && (
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm shadow-sm flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          )}
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
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isCompleted
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
