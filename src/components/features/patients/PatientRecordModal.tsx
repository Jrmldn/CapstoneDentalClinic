'use client'

import { useState } from 'react'
import {
  User,
  Activity,
  History,
  FileText,
  ClipboardList,
  HeartPulse,
  X
} from 'lucide-react'
import type { PatientSummary } from './PatientsClient'

export type RecordTab = 'info' | 'chart' | 'treatments' | 'assessments' | 'appts'

export interface FullPatientDetail extends PatientSummary {
  address: string | null
}

export interface MedicalHistory {
  blood_type: string | null
  allergies: string[]
  current_medications: string[]
  medical_conditions: string[]
  previous_surgeries: string | null
  is_pregnant: boolean
  is_smoker: boolean
}

export interface ToothCondition {
  id: number
  tooth_number: number
  tooth_type: string
  condition: string
  surface: string | null
  notes: string | null
  recorded_at: string
}

export interface DentalChart {
  id: number
  tooth_conditions: ToothCondition[]
}

export interface TreatmentHistory {
  id: number
  performed_at: string
  services: { name: string } | { name: string }[] | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

export interface Assessment {
  id: number
  assessed_at: string
  chief_complaint: string
  diagnosis: string
  treatment_plan: string
  notes: string | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

export interface Prescription {
  id: number
  prescribed_at: string
  medication_name: string
  dosage: string
  frequency: string
  duration: string
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

export interface AppointmentRecord {
  id: number
  scheduled_at: string
  status: string
  services: { name: string } | { name: string }[] | null
  dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

export interface PatientRecord {
  patient: FullPatientDetail
  medicalHistory: MedicalHistory | null
  dentalCharts: DentalChart[]
  treatmentHistory: TreatmentHistory[]
  assessments: Assessment[]
  prescriptions: Prescription[]
  periodontalScreenings: unknown[]
  tmjAssessments: unknown[]
  oralSurgeryRecords: unknown[]
  appointments: AppointmentRecord[]
}

interface PatientRecordModalProps {
  record: PatientRecord | null
  onClose: () => void
}

export default function PatientRecordModal({ record, onClose }: PatientRecordModalProps) {
  const [activeRecordTab, setActiveRecordTab] = useState<RecordTab>('info')

  if (!record) return null

  const tabs: Array<{ id: RecordTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'info', label: 'EHR Summary & Medicals', icon: User },
    { id: 'chart', label: 'Dental Tooth Conditions', icon: Activity },
    { id: 'treatments', label: 'Treatment History', icon: History },
    { id: 'assessments', label: 'Assessments', icon: FileText },
    { id: 'appts', label: 'Appointments', icon: ClipboardList }
  ]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {record.patient.first_name} {record.patient.last_name}
              </h3>
              <p className="text-xs text-gray-500">Clinical Chart &amp; Health Record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white px-6">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveRecordTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 outline-none ${
                  activeRecordTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeRecordTab === 'info' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-2">Personal Details</h4>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">GENDER</span>
                  <span className="text-sm font-medium capitalize text-slate-800">{record.patient.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">BIRTHDATE</span>
                  <span className="text-sm font-medium text-slate-800">{record.patient.birthdate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">PHONE</span>
                  <span className="text-sm font-medium text-slate-800">{record.patient.phone}</span>
                </div>
                {record.patient.email && (
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">EMAIL</span>
                    <span className="text-sm font-medium text-slate-800">{record.patient.email}</span>
                  </div>
                )}
                <div className="col-span-3">
                  <span className="text-[10px] text-gray-400 block font-semibold">ADDRESS</span>
                  <span className="text-sm font-medium text-slate-800">{record.patient.address || '—'}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-2">Medical History Summary</h4>
                </div>
                {record.medicalHistory ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">BLOOD TYPE</span>
                        <span className="text-sm font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {record.medicalHistory.blood_type || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">ALLERGIES</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {record.medicalHistory.allergies?.length > 0 ? (
                            record.medicalHistory.allergies.map((a: string) => (
                              <span
                                key={a}
                                className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-medium"
                              >
                                {a}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">No allergies listed</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">CURRENT MEDICATIONS</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {record.medicalHistory.current_medications?.length > 0 ? (
                            record.medicalHistory.current_medications.map((m: string) => (
                              <span
                                key={m}
                                className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-full font-medium"
                              >
                                {m}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">None listed</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">MEDICAL CONDITIONS</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {record.medicalHistory.medical_conditions?.length > 0 ? (
                            record.medicalHistory.medical_conditions.map((c: string) => (
                              <span
                                key={c}
                                className="bg-red-50 text-red-700 border border-red-200 text-xs px-2 py-0.5 rounded-full font-medium"
                              >
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">None listed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 text-center py-6 text-gray-400 text-sm">
                    No medical history filled out for this patient.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeRecordTab === 'chart' && (
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-4">Dental Chart Conditions</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-slate-500 font-bold border-b border-gray-100">
                      <th className="px-4 py-2">Date Recorded</th>
                      <th className="px-4 py-2">Tooth Number</th>
                      <th className="px-4 py-2">Tooth Type</th>
                      <th className="px-4 py-2">Condition</th>
                      <th className="px-4 py-2">Surface</th>
                      <th className="px-4 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-slate-700">
                    {record.dentalCharts?.flatMap((chart: DentalChart) =>
                      chart.tooth_conditions?.map((cond: ToothCondition) => (
                        <tr key={cond.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-semibold text-gray-500">
                            {new Date(cond.recorded_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">Tooth #{cond.tooth_number}</td>
                          <td className="px-4 py-3 capitalize">{cond.tooth_type}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-amber-50 text-amber-700 border border-amber-200">
                              {cond.condition.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 uppercase font-medium">{cond.surface || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{cond.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                    {record.dentalCharts?.flatMap((c: DentalChart) => c.tooth_conditions ?? []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400">
                          No tooth conditions recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeRecordTab === 'treatments' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-4">Treatment History</h4>
                <div className="divide-y divide-gray-100">
                  {record.treatmentHistory?.length > 0 ? (
                    record.treatmentHistory.map((treat: TreatmentHistory) => {
                      const serviceObj = Array.isArray(treat.services) ? treat.services[0] : treat.services
                      const dentistObj = Array.isArray(treat.dentists) ? treat.dentists[0] : treat.dentists
                      return (
                        <div key={treat.id} className="py-3 flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-slate-850 text-sm">{serviceObj?.name}</p>
                            <p className="text-xs text-gray-400">
                              Performed by: Dr. {dentistObj ? `${dentistObj.first_name} ${dentistObj.last_name}` : 'Unknown'}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 font-semibold">
                            {new Date(treat.performed_at).toLocaleDateString()}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-center py-6 text-gray-400 text-xs">No treatments recorded.</p>
                  )}
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-4">Prescriptions</h4>
                <div className="divide-y divide-gray-100">
                  {record.prescriptions?.length > 0 ? (
                    record.prescriptions.map((pres: Prescription) => {
                      const dentistObj = Array.isArray(pres.dentists) ? pres.dentists[0] : pres.dentists
                      return (
                        <div key={pres.id} className="py-3 flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-slate-850 text-sm">{pres.medication_name}</p>
                            <p className="text-xs text-slate-600">
                              Dosage: {pres.dosage} | Frequency: {pres.frequency} | Duration: {pres.duration}
                            </p>
                            <p className="text-[10px] text-gray-450 mt-1">
                              Prescribed by Dr. {dentistObj ? `${dentistObj.first_name} ${dentistObj.last_name}` : 'Unknown'}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 font-semibold">
                            {new Date(pres.prescribed_at).toLocaleDateString()}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-center py-6 text-gray-400 text-xs">No prescriptions recorded.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeRecordTab === 'assessments' && (
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-4">Clinical Assessments</h4>
              <div className="space-y-4">
                {record.assessments?.length > 0 ? (
                  record.assessments.map((ass: Assessment) => {
                    const dentistObj = Array.isArray(ass.dentists) ? ass.dentists[0] : ass.dentists
                    return (
                      <div key={ass.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-1.5 mb-1.5">
                          <span className="font-bold text-slate-700">
                            Assessment by Dr. {dentistObj ? `${dentistObj.first_name} ${dentistObj.last_name}` : 'Unknown'}
                          </span>
                          <span className="text-gray-500 font-semibold">{new Date(ass.assessed_at).toLocaleDateString()}</span>
                        </div>
                        <p><strong>Chief Complaint:</strong> {ass.chief_complaint}</p>
                        <p><strong>Diagnosis:</strong> {ass.diagnosis}</p>
                        <p><strong>Treatment Plan:</strong> {ass.treatment_plan}</p>
                        {ass.notes && <p className="text-gray-500 italic"><strong>Notes:</strong> {ass.notes}</p>}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center py-6 text-gray-400 text-xs">No clinical assessments recorded.</p>
                )}
              </div>
            </div>
          )}

          {activeRecordTab === 'appts' && (
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-4">Appointment History</h4>
              <div className="divide-y divide-gray-100">
                {record.appointments?.length > 0 ? (
                  record.appointments.map((appt: AppointmentRecord) => {
                    const serviceObj = Array.isArray(appt.services) ? appt.services[0] : appt.services
                    const dentistObj = Array.isArray(appt.dentists) ? appt.dentists[0] : appt.dentists
                    return (
                      <div key={appt.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{serviceObj?.name}</p>
                          <p className="text-gray-500">
                            Dr. {dentistObj ? `${dentistObj.first_name} ${dentistObj.last_name}` : 'TBD'} | Status:{' '}
                            <span className="capitalize">{appt.status}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{new Date(appt.scheduled_at).toLocaleDateString()}</p>
                          <p className="text-gray-500">
                            {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center py-6 text-gray-400 text-xs">No appointments recorded.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-xs"
          >
            Close EHR Viewer
          </button>
        </div>
      </div>
    </div>
  )
}
