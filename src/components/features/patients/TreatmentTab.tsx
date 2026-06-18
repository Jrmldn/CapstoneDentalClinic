'use client'

import { useState, useEffect } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Calendar, BookOpen, User } from 'lucide-react'
import { addTreatmentRecord } from '@/actions/patientActions'
import { fetchServices } from '@/actions/serviceActions'

export interface TreatmentHistory {
  id: number
  performed_at: string | null
  treatment: string
  notes: string | null
  tooth_number: number | null
  service_id: number | null
  services: { id: number; name: string } | { id: number; name: string }[] | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

interface TreatmentTabProps {
  patientId: number
  clinicId: number
  dentistId?: number
  treatments: TreatmentHistory[]
  onRefresh: () => Promise<void>
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

    // Build the notes description with prescription if needed
    const serializedNotes = JSON.stringify({
      clinical_notes: clinicalNotes,
      prescription_notes: prescriptionNotes,
    })

    const res = await addTreatmentRecord({
      patient_id: patientId,
      clinic_id: clinicId,
      dentist_id: dentistId || 0,
      service_id: selectedServiceId,
      tooth_number: toothNumber ? parseInt(toothNumber) : null,
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
    } catch (e) {}
    return { clinical_notes: notesStr || '—', prescription_notes: '—' }
  }

  // Alpha translation for child teeth representation
  const getToothLabel = (num: number | null): string => {
    if (!num) return '—'
    if (num >= 101 && num <= 120) {
      return String.fromCharCode(num - 36) // 101 -> A
    }
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Treatment History</h4>
          <p className="text-xs text-gray-500 mt-0.5">Access and log treatment procedures and clinic visits.</p>
        </div>
        {dentistId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancel' : 'Add Record'}
          </button>
        )}
      </div>

      {/* New Treatment Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-5 rounded-xl border border-gray-250/60 shadow-xs space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Add Treatment Record</span>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Select Service</label>
              <select
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedServiceId || ''}
                onChange={e => {
                  const id = parseInt(e.target.value)
                  setSelectedServiceId(id)
                  const matched = services.find(s => s.id === id)
                  if (matched) setTreatmentName(matched.name)
                }}
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Tooth Number / Letter (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 14, 28, A, M"
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
                value={toothNumber}
                onChange={e => {
                  const val = e.target.value.toUpperCase()
                  // Support letter teeth A-T and numbers 1-32
                  setToothNumber(val)
                }}
              />
            </div>
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

      {/* Treatments list matching treatment.png */}
      <div className="space-y-4">
        {treatments.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-xl border border-gray-150 shadow-xs">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2.5" />
            <p className="text-xs text-gray-400">No treatment records found for this patient.</p>
          </div>
        ) : (
          treatments.map((treat, idx) => {
            const isExpanded = expandedCardId === treat.id
            const parsedNotes = parseNotesObj(treat.notes)
            const dentistObj = Array.isArray(treat.dentists) ? treat.dentists[0] : treat.dentists
            const toothLabel = getToothLabel(treat.tooth_number)

            // TR code (mock code, e.g. TR-001, TR-002, etc.)
            const trCode = `TR-${(treatments.length - idx).toString().padStart(3, '0')}`

            // Date formatting
            const dateStr = treat.performed_at
              ? new Date(treat.performed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '—'

            return (
              <div
                key={treat.id}
                className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden hover:shadow-sm transition"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(treat.id)}
                  className="px-5 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Tooth badge */}
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {toothLabel}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-slate-800 text-sm truncate">{treat.treatment}</h5>
                      <span className="text-xs text-gray-400 font-semibold block">
                        {dateStr} {toothLabel !== '—' ? `· Tooth #${toothLabel}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold uppercase tracking-wider flex items-center gap-1 border border-teal-150">
                      <Calendar className="w-2.5 h-2.5" />
                      Follow-up
                    </span>
                    {isExpanded ? <ChevronUp className="w-4.5 h-4.5 text-gray-400" /> : <ChevronDown className="w-4.5 h-4.5 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-slate-50/30 space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Notes</span>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-lg border border-gray-150">
                        {parsedNotes.clinical_notes}
                      </p>
                    </div>

                    {parsedNotes.prescription_notes && parsedNotes.prescription_notes !== '—' && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prescription</span>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-lg border border-gray-150">
                          {parsedNotes.prescription_notes}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:justify-between md:items-center pt-2.5 border-t border-gray-100 text-[11px] text-slate-500 font-semibold gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Attending: Dr. {dentistObj ? `${dentistObj.first_name} ${dentistObj.last_name}` : 'Cruz'}</span>
                        </div>
                        {(() => {
                          const clinicObj = Array.isArray(treat.clinics) ? treat.clinics[0] : treat.clinics
                          if (!clinicObj) return null
                          return (
                            <span className="text-slate-400 font-medium">
                              · Recorded at {clinicObj.name} on {treat.performed_at ? new Date(treat.performed_at).toLocaleString() : '—'}
                            </span>
                          )
                        })()}
                      </div>
                      <span className="font-mono text-gray-400 text-xs">{trCode}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
