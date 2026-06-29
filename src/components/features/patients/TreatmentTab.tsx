'use client'

import { useState, useEffect } from 'react'
import { Plus, X, ChevronDown, ChevronUp, BookOpen, User } from 'lucide-react'
import { addTreatmentRecord } from '@/actions/clinicalRecordActions'
import { fetchServices } from '@/actions/serviceActions'
import { toothInputToNumber, toothNumberToLabel, serviceRequiresToothNumber } from '@/utils/teeth'
import { formatDate, formatDateTime } from '@/lib/date'
import type { TreatmentHistory } from './types'

export interface StagedTreatmentData {
  patient_id: number
  clinic_id: number
  dentist_id: number
  service_id: number | null
  tooth_number: number | null
  treatment: string
  notes: string
  performed_at: string
  services?: { id: number; name: string } | null
}

interface TreatmentTabProps {
  patientId: number
  clinicId: number
  dentistId?: number
  treatments: TreatmentHistory[]
  onRefresh: () => Promise<void>
  readOnly?: boolean
  onAddTreatment?: (treatment: StagedTreatmentData) => void
}

interface Service {
  id: number
  name: string
}

export default function TreatmentTab({
  patientId,
  clinicId,
  dentistId,
  treatments,
  onRefresh,
  readOnly = false,
  onAddTreatment,
}: TreatmentTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [treatmentName, setTreatmentName] = useState('')
  const [toothNumber, setToothNumber] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [prescriptionNotes, setPrescriptionNotes] = useState('')
  const [performedAt, setPerformedAt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Expandable cards state
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null)

  // Load clinic services
  useEffect(() => {
    async function loadServices() {
      const res = await fetchServices(clinicId)
      if (res.success && res.services) {
        setServices(res.services)
        if (res.services.length > 0) {
          setSelectedServiceId(res.services[0].id)
          setTreatmentName(res.services[0].name)
        }
      }
    }
    loadServices()
  }, [clinicId])

  const toggleExpand = (id: number) => {
    setExpandedCardId(prev => (prev === id ? null : id))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!treatmentName) {
      alert('Please fill out the treatment name.')
      return
    }

    setIsSubmitting(true)

    const requiresTooth = serviceRequiresToothNumber(treatmentName)
    const finalToothNum = requiresTooth ? toothInputToNumber(toothNumber) : null

    if (requiresTooth && finalToothNum === null) {
      alert('Please enter a valid tooth number (1-32 or A-T).')
      setIsSubmitting(false)
      return
    }

    // Build the notes description with prescription if needed
    const serializedNotes = JSON.stringify({
      clinical_notes: clinicalNotes,
      prescription_notes: prescriptionNotes,
    })

    if (onAddTreatment) {
      onAddTreatment({
        patient_id: patientId,
        clinic_id: clinicId,
        dentist_id: dentistId || 0,
        service_id: selectedServiceId,
        tooth_number: finalToothNum,
        treatment: treatmentName,
        notes: serializedNotes,
        performed_at: performedAt ? new Date(performedAt).toISOString() : new Date().toISOString(),
      })
      setIsSubmitting(false)
      setTreatmentName(services[0]?.name || '')
      setToothNumber('')
      setClinicalNotes('')
      setPrescriptionNotes('')
      setPerformedAt('')
      setShowForm(false)
      return
    }

    const res = await addTreatmentRecord({
      patient_id: patientId,
      clinic_id: clinicId,
      dentist_id: dentistId || 0,
      service_id: selectedServiceId,
      tooth_number: finalToothNum,
      treatment: treatmentName,
      notes: serializedNotes,
      performed_at: performedAt ? new Date(performedAt).toISOString() : undefined,
    })

    setIsSubmitting(false)

    if (res.success) {
      alert('Treatment record added successfully!')
      setTreatmentName(services[0]?.name || '')
      setToothNumber('')
      setClinicalNotes('')
      setPrescriptionNotes('')
      setPerformedAt('')
      setShowForm(false)
      await onRefresh()
    } else {
      alert(res.error || 'Failed to add treatment record')
    }
  }

  // Helper to parse notes JSON
  const parseNotesObj = (notesStr: string | null) => {
    try {
      if (notesStr && notesStr.startsWith('{')) {
        return JSON.parse(notesStr)
      }
    } catch {}
    return { clinical_notes: notesStr || '—', prescription_notes: '—' }
  }

  // Group saved treatments by appointment_id for the read-only history view.
  // Treatments sharing an appointment_id are collapsed into one session accordion.
  // null appointment_id = legacy standalone entry, rendered individually.
  const sessionGroups: { key: number; items: TreatmentHistory[] }[] = []
  const apptSeen = new Set<number>()
  for (const t of treatments) {
    if (t.appointment_id !== null && !apptSeen.has(t.appointment_id)) {
      apptSeen.add(t.appointment_id)
      sessionGroups.push({
        key: t.appointment_id,
        items: treatments.filter(x => x.appointment_id === t.appointment_id),
      })
    } else if (t.appointment_id === null) {
      sessionGroups.push({ key: t.id, items: [t] })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Treatment</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {onAddTreatment ? 'Log a treatment for this session.' : 'Access and log treatment procedures and clinic visits.'}
          </p>
        </div>
        {!readOnly && dentistId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm
              ? 'flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-slate-600 rounded-lg text-xs font-semibold transition'
              : 'flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition'}
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancel' : 'Add Record'}
          </button>
        )}
      </div>

      {/* New Treatment Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-5 rounded-xl border border-gray-250/60 shadow-xs space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="border-b border-gray-100 pb-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Add Treatment Record</span>
          </div>

          {/* Service selector + Date — always shown */}
          <div className={`grid grid-cols-1 gap-4 ${serviceRequiresToothNumber(treatmentName) ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Select Service</label>
              <select
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedServiceId || ''}
                onChange={e => {
                  const id = parseInt(e.target.value)
                  setSelectedServiceId(id)
                  const matched = services.find(s => s.id === id)
                  if (matched) {
                    setTreatmentName(matched.name)
                    if (!serviceRequiresToothNumber(matched.name)) {
                      setToothNumber('')
                    }
                  }
                }}
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {/* Tooth Number — visible only for tooth-specific services */}
            {serviceRequiresToothNumber(treatmentName) && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tooth Number / Letter (Required)</label>
                <input
                  type="text"
                  placeholder="e.g. 14, 28, A, M"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  value={toothNumber}
                  onChange={e => {
                    const val = e.target.value.toUpperCase()
                    setToothNumber(val)
                  }}
                  required
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Date Performed</label>
              <input
                type="date"
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
                value={performedAt}
                onChange={e => setPerformedAt(e.target.value)}
              />
            </div>
          </div>

          {/* Clinical Notes only (Prescribed Medicines removed in session mode) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Clinical Notes</label>
              <textarea
                rows={3}
                placeholder="Describe treatment procedure..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                value={clinicalNotes}
                onChange={e => setClinicalNotes(e.target.value)}
              />
            </div>
            {/* Prescribed Medicines — hidden in session mode */}
            {!onAddTreatment && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Prescribed Medicines</label>
                <textarea
                  rows={3}
                  placeholder="Drugs, dosage, and frequency..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  value={prescriptionNotes}
                  onChange={e => setPrescriptionNotes(e.target.value)}
                />
              </div>
            )}
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
              {isSubmitting ? 'Saving...' : onAddTreatment ? 'Add to Invoice' : 'Save Record'}
            </button>
          </div>
        </form>
      )}

      {/* Treatments list — hidden in session mode (history viewed elsewhere) */}
      {!onAddTreatment && (
      <div className="space-y-4">
        {sessionGroups.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-xl border border-gray-150 shadow-xs">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2.5" />
            <p className="text-xs text-gray-400">No treatment records found for this patient.</p>
          </div>
        ) : (
          sessionGroups.map((group, groupIdx) => {
              const expandKey = group.key
              const isExpanded = expandedCardId === expandKey
              const first = group.items[0]
              const dentistObj = Array.isArray(first.dentists) ? first.dentists[0] : first.dentists
              const clinicObj = Array.isArray(first.clinics) ? first.clinics[0] : first.clinics
              const dateStr = formatDate(first.performed_at)
              const isSession = group.items.length > 1
              const sessionCode = `S-${(sessionGroups.length - groupIdx).toString().padStart(3, '0')}`

              return (
                <div
                  key={expandKey}
                  className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden hover:shadow-sm transition"
                >
                  {/* Header Row */}
                  <div
                    onClick={() => toggleExpand(expandKey)}
                    className="px-5 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {isSession ? group.items.length : toothNumberToLabel(first.tooth_number)}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-slate-800 text-sm truncate">
                          {isSession ? `Session · ${group.items.length} procedures` : first.treatment}
                        </h5>
                        <span className="text-xs text-gray-400 font-semibold block">
                          {dateStr}
                          {!isSession && toothNumberToLabel(first.tooth_number) !== '—' ? ` · Tooth #${toothNumberToLabel(first.tooth_number)}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronUp className="w-4.5 h-4.5 text-gray-400" /> : <ChevronDown className="w-4.5 h-4.5 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-slate-50/30 space-y-4 animate-in fade-in duration-200">
                      {isSession ? (
                        // Multi-service session: list each procedure as a sub-row
                        <div className="space-y-2">
                          {group.items.map((item) => {
                            const parsedNotes = parseNotesObj(item.notes)
                            const toothLabel = toothNumberToLabel(item.tooth_number)
                            return (
                              <div key={item.id} className="bg-white border border-gray-150 rounded-lg p-3 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">{item.treatment}</span>
                                  {toothLabel !== '—' && (
                                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">Tooth #{toothLabel}</span>
                                  )}
                                </div>
                                {parsedNotes.clinical_notes && parsedNotes.clinical_notes !== '—' && (
                                  <p className="text-[11px] text-slate-500 leading-relaxed">{parsedNotes.clinical_notes}</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        // Single-service entry: full detail view
                        <>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Notes</span>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-lg border border-gray-150">
                              {parseNotesObj(first.notes).clinical_notes}
                            </p>
                          </div>
                          {parseNotesObj(first.notes).prescription_notes && parseNotesObj(first.notes).prescription_notes !== '—' && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prescription</span>
                              <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-lg border border-gray-150">
                                {parseNotesObj(first.notes).prescription_notes}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex flex-col md:flex-row md:justify-between md:items-center pt-2.5 border-t border-gray-100 text-[11px] text-slate-500 font-semibold gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Attending: Dr. {dentistObj ? `${dentistObj.first_name} ${dentistObj.last_name}` : '—'}</span>
                          </div>
                          {clinicObj && (
                            <span className="text-slate-400 font-medium">
                              · {clinicObj.name} · {formatDateTime(first.performed_at)}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-gray-400 text-xs">{sessionCode}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
        )}
      </div>
      )}
    </div>
  )
}
