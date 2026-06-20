'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Activity,
  History,
  FileText,
  ClipboardList,
  HeartPulse,
  X,
  Plus,
  RefreshCw,
  AlertCircle,
  Calendar,
  Camera
} from 'lucide-react'
import { fetchPatientRecord, updatePatientMedicalHistory } from '@/actions/patientMedicalActions'
import { addClinicalAssessment } from '@/actions/clinicalRecordActions'
import { formatPhone } from '@/utils/phone-helpers'
import DentalChartTab from './DentalChartTab'
import TreatmentTab from './TreatmentTab'
import PrescriptionsTab from './PrescriptionsTab'
import PeriodontalTab from './PeriodontalTab'
import FollowupsTab from './FollowupsTab'
import PhotosTab from './PhotosTab'
import type {
  RecordTab,
  FullPatientDetail,
  MedicalHistory,
  ToothCondition,
  DentalChart,
  TreatmentHistory,
  Assessment,
  Prescription,
  AppointmentRecord,
  PatientRecord,
  PeriodontalScreening,
  TmjAssessment
} from './types'

interface PatientRecordModalProps {
  record: PatientRecord | null
  onClose: () => void
  dentistId?: number
  clinicId?: number
  viewerRole?: 'dentist' | 'staff'
}

export default function PatientRecordModal({ record, onClose, dentistId, clinicId, viewerRole = 'dentist' }: PatientRecordModalProps) {
  const now = Date.now()
  const [activeRecordTab, setActiveRecordTab] = useState<RecordTab>('chart')
  const [localRecord, setLocalRecord] = useState<PatientRecord | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Clinical Assessment Form State
  const [showAssessmentForm, setShowAssessmentForm] = useState(false)
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [assessmentNotes, setAssessmentNotes] = useState('')
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false)

  // Medical History inline edit state
  const [editBloodType, setEditBloodType] = useState('')
  const [editBloodPressure, setEditBloodPressure] = useState('')
  const [editMedicalFlags, setEditMedicalFlags] = useState('')
  const [editAllergies, setEditAllergies] = useState('')
  const [editCurrentMeds, setEditCurrentMeds] = useState('')
  const [editMedConditions, setEditMedConditions] = useState('')
  const [editIsPregnant, setEditIsPregnant] = useState(false)
  const [editIsSmoker, setEditIsSmoker] = useState(false)
  const [isSavingMedHistory, setIsSavingMedHistory] = useState(false)

  useEffect(() => {
    setLocalRecord(record)
    const mh = record?.medicalHistory
    setEditBloodType(mh?.blood_type || '')
    setEditBloodPressure(mh?.blood_pressure || '')
    setEditMedicalFlags(mh?.medical_flags || '')
    setEditAllergies(mh?.allergies?.join(', ') || '')
    setEditCurrentMeds(mh?.current_medications?.join(', ') || '')
    setEditMedConditions(mh?.medical_conditions?.join(', ') || '')
    setEditIsPregnant(mh?.is_pregnant || false)
    setEditIsSmoker(mh?.is_smoker || false)
  }, [record])

  const handleSaveMedicalHistory = async () => {
    if (!localRecord) return
    setIsSavingMedHistory(true)
    const res = await updatePatientMedicalHistory(localRecord.patient.id, {
      blood_type: editBloodType || null,
      blood_pressure: editBloodPressure || null,
      medical_flags: editMedicalFlags || null,
      allergies: editAllergies ? editAllergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      current_medications: editCurrentMeds ? editCurrentMeds.split(',').map(s => s.trim()).filter(Boolean) : [],
      medical_conditions: editMedConditions ? editMedConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
      is_pregnant: editIsPregnant,
      is_smoker: editIsSmoker,
    })
    setIsSavingMedHistory(false)
    if (res.success) {
      await handleRefreshRecord()
    } else {
      alert(res.error || 'Failed to save')
    }
  }

  if (!localRecord) return null

  const lastVisitDate = (() => {
    if (!localRecord.appointments || localRecord.appointments.length === 0) return 'No visits recorded'
    const completedAppts = localRecord.appointments
      .filter(appt => appt.status === 'completed')
      .map(appt => new Date(appt.scheduled_at))
      .sort((a, b) => b.getTime() - a.getTime())

    if (completedAppts.length === 0) return 'No visits recorded'
    return completedAppts[0].toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  })()


  const tabs: Array<{ id: RecordTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'chart', label: 'Dental Chart', icon: Activity },
    { id: 'treatments', label: 'Treatment', icon: History },
    { id: 'prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { id: 'info', label: 'Medical History', icon: User },
    { id: 'periodontal', label: 'Periodontal', icon: HeartPulse },
    { id: 'followups', label: 'Follow-ups', icon: Calendar },
    { id: 'photos', label: 'Photos', icon: Camera }
  ]

  const handleRefreshRecord = async () => {
    setIsRefreshing(true)
    const res = await fetchPatientRecord(localRecord.patient.id, clinicId)
    setIsRefreshing(false)
    if (res.success && res.record) {
      setLocalRecord(res.record as PatientRecord)
    }
  }

  const handleAddAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chiefComplaint || !diagnosis || !treatmentPlan) {
      alert('Please fill out all required fields.')
      return
    }
    setIsSubmittingAssessment(true)
    const res = await addClinicalAssessment({
      patient_id: localRecord.patient.id,
      clinic_id: clinicId ?? 0,
      dentist_id: dentistId!,
      chief_complaint: chiefComplaint,
      diagnosis,
      treatment_plan: treatmentPlan,
      notes: assessmentNotes || undefined
    })
    setIsSubmittingAssessment(false)
    if (res.success) {
      alert('Clinical assessment added successfully!')
      setChiefComplaint('')
      setDiagnosis('')
      setTreatmentPlan('')
      setAssessmentNotes('')
      setShowAssessmentForm(false)
      handleRefreshRecord()
    } else {
      alert(res.error || 'Failed to add clinical assessment')
    }
  }


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
                {localRecord.patient.first_name} {localRecord.patient.last_name}
              </h3>
              <p className="text-xs text-gray-500">Clinical Chart &amp; Health Record</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isRefreshing && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
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
                <div className="col-span-3 flex justify-between items-center border-b border-gray-100 pb-1 mb-2">
                  <h4 className="font-bold text-slate-900 text-sm">Personal Details</h4>
                  {localRecord.medicalHistory?.detailed_info?.profile_updated_by ? (
                    <span className="text-[10px] text-gray-400 font-medium">
                      Last updated: {localRecord.medicalHistory.detailed_info.profile_updated_at ? new Date(localRecord.medicalHistory.detailed_info.profile_updated_at).toLocaleString() : '—'}
                      {` by ${localRecord.medicalHistory.detailed_info.profile_updated_by}`}
                      {localRecord.medicalHistory.detailed_info.profile_updated_by_branch && ` (${localRecord.medicalHistory.detailed_info.profile_updated_by_branch})`}
                    </span>
                  ) : (
                    localRecord.patient.updated_at && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        Last updated: {new Date(localRecord.patient.updated_at).toLocaleString()}
                      </span>
                    )
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">GENDER</span>
                  <span className="text-sm font-medium capitalize text-slate-800">{localRecord.patient.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">BIRTHDATE</span>
                  <span className="text-sm font-medium text-slate-800">{localRecord.patient.birthdate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">PHONE</span>
                  <span className="text-sm font-medium text-slate-800">{formatPhone(localRecord.patient.phone)}</span>
                </div>
                {localRecord.patient.email && (
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">EMAIL</span>
                    <span className="text-sm font-medium text-slate-800">{localRecord.patient.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">LAST VISIT</span>
                  <span className="text-sm font-semibold text-blue-600">{lastVisitDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">PREVIOUS DENTIST</span>
                  <span className="text-sm font-medium text-slate-800">{(localRecord.patient as any).previous_dentist || 'None'}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-[10px] text-gray-400 block font-semibold">ADDRESS</span>
                  <span className="text-sm font-medium text-slate-800">{localRecord.patient.address || '—'}</span>
                </div>

                {/* Parent / Guardian Information (shown for minors) */}
                {(() => {
                  const birthdateStr = localRecord.patient.birthdate
                  const isMinor = birthdateStr
                    ? Math.floor((now - new Date(birthdateStr).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) < 18
                    : false
                  if (!isMinor) return null
                  return (
                    <div className="col-span-3 mt-2 p-4 bg-amber-50/50 border border-amber-100 rounded-xl grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Parent / Guardian Details (Minor)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">GUARDIAN NAME</span>
                        <span className="text-xs font-semibold text-slate-800">{(localRecord.patient as any).guardian_name || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">GUARDIAN PHONE</span>
                        <span className="text-xs font-semibold text-slate-800">{(localRecord.patient as any).guardian_phone || '—'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block font-semibold">GUARDIAN ADDRESS</span>
                        <span className="text-xs font-semibold text-slate-800">{(localRecord.patient as any).guardian_address || '—'}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs grid grid-cols-2 gap-5">
                <div className="col-span-2 flex justify-between items-center border-b border-gray-100 pb-1 mb-2">
                  <h4 className="font-bold text-slate-900 text-sm">Medical History Summary</h4>
                  {localRecord.medicalHistory && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      Last updated: {localRecord.medicalHistory.updated_at ? new Date(localRecord.medicalHistory.updated_at).toLocaleString() : '—'}
                      {localRecord.medicalHistory.detailed_info?.updated_by && ` by ${localRecord.medicalHistory.detailed_info.updated_by}`}
                      {localRecord.medicalHistory.detailed_info?.updated_by_branch && ` (${localRecord.medicalHistory.detailed_info.updated_by_branch})`}
                    </span>
                  )}
                </div>
                {localRecord.medicalHistory ? (
                  <>
                    {/* Left column */}
                    <div className="space-y-4">
                      {/* Blood Type */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">BLOOD TYPE</span>
                        {viewerRole === 'staff' ? (
                          <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                            {localRecord.medicalHistory.blood_type || 'Unknown'}
                          </span>
                        ) : (
                          <select
                            value={editBloodType}
                            onChange={e => setEditBloodType(e.target.value)}
                            className="mt-0.5 w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                          >
                            <option value="">Unknown</option>
                            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => (
                              <option key={bt} value={bt}>{bt}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Blood Pressure */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">BLOOD PRESSURE</span>
                        {viewerRole === 'staff' ? (
                          <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                            {localRecord.medicalHistory.blood_pressure || '—'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            placeholder="e.g. 120/80 mmHg"
                            value={editBloodPressure}
                            onChange={e => setEditBloodPressure(e.target.value)}
                            className="mt-0.5 w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                          />
                        )}
                      </div>

                      {/* Pregnancy Status */}
                      {localRecord.patient.gender === 'female' && (
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold">PREGNANCY STATUS</span>
                          {viewerRole === 'staff' ? (
                            <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                              {localRecord.medicalHistory.is_pregnant ? 'Pregnant' : 'Not Pregnant'}
                            </span>
                          ) : (
                            <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={editIsPregnant}
                                onChange={e => setEditIsPregnant(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                              />
                              <span className="text-xs font-semibold text-slate-700">Currently Pregnant</span>
                            </label>
                          )}
                        </div>
                      )}

                      {/* Smoking Status */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">SMOKING STATUS</span>
                        {viewerRole === 'staff' ? (
                          <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                            {localRecord.medicalHistory.is_smoker ? 'Smoker' : 'Non-smoker'}
                          </span>
                        ) : (
                          <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={editIsSmoker}
                              onChange={e => setEditIsSmoker(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-xs font-semibold text-slate-700">Active Smoker</span>
                          </label>
                        )}
                      </div>

                      {/* Allergies */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">ALLERGIES</span>
                        {viewerRole === 'staff' ? (
                          <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                            {localRecord.medicalHistory.allergies?.length > 0
                              ? localRecord.medicalHistory.allergies.join(', ')
                              : 'No allergies listed'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            placeholder="e.g. Penicillin, Peanuts (comma-separated)"
                            value={editAllergies}
                            onChange={e => setEditAllergies(e.target.value)}
                            className="mt-0.5 w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                          />
                        )}
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">
                      {/* Medical Flags */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">MEDICAL FLAGS</span>
                        {viewerRole === 'staff' ? (
                          <span className="text-sm font-bold mt-0.5 block text-slate-800">
                            {localRecord.medicalHistory.medical_flags || 'None'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            placeholder="e.g. Penicillin allergy, Latex"
                            value={editMedicalFlags}
                            onChange={e => setEditMedicalFlags(e.target.value)}
                            className="mt-0.5 w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800 placeholder:text-gray-300"
                          />
                        )}
                      </div>

                      {/* Current Medications */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">CURRENT MEDICATIONS</span>
                        {viewerRole === 'staff' ? (
                          <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                            {localRecord.medicalHistory.current_medications?.length > 0
                              ? localRecord.medicalHistory.current_medications.join(', ')
                              : 'None listed'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            placeholder="e.g. Insulin, Metformin (comma-separated)"
                            value={editCurrentMeds}
                            onChange={e => setEditCurrentMeds(e.target.value)}
                            className="mt-0.5 w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                          />
                        )}
                      </div>

                      {/* Medical Conditions */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">MEDICAL CONDITIONS</span>
                        {viewerRole === 'staff' ? (
                          <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                            {localRecord.medicalHistory.medical_conditions?.length > 0
                              ? localRecord.medicalHistory.medical_conditions.join(', ')
                              : 'None listed'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            placeholder="e.g. Diabetes, Hypertension (comma-separated)"
                            value={editMedConditions}
                            onChange={e => setEditMedConditions(e.target.value)}
                            className="mt-0.5 w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                          />
                        )}
                      </div>
                    </div>

                    {/* Detailed info section if present */}
                    {localRecord.medicalHistory.detailed_info && (
                      <div className="col-span-2 border-t border-gray-100 pt-4 mt-2 space-y-4">
                        <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Detailed Medical History Questionnaire</h5>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                          {/* Physician Info */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-gray-100 col-span-1 sm:col-span-2 md:col-span-3 space-y-1.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase block">Primary Physician Details</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
                              <p className="text-slate-600"><span className="font-bold text-slate-700">Name:</span> {localRecord.medicalHistory.detailed_info.physician_name || '—'}</p>
                              <p className="text-slate-600"><span className="font-bold text-slate-700">Specialty:</span> {localRecord.medicalHistory.detailed_info.physician_specialty || '—'}</p>
                              <p className="text-slate-600"><span className="font-bold text-slate-700">Office Address:</span> {localRecord.medicalHistory.detailed_info.physician_office_address || '—'}</p>
                              <p className="text-slate-600"><span className="font-bold text-slate-700">Office Phone:</span> {localRecord.medicalHistory.detailed_info.physician_office_phone || '—'}</p>
                            </div>
                          </div>

                          {/* Dental Visit & Bleeding Time */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase block">Last Dental Visit</span>
                            <p className="font-bold text-slate-800 mt-0.5">{localRecord.medicalHistory.detailed_info.last_dental_visit || '—'}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase block">Bleeding Time</span>
                            <p className="font-bold text-slate-800 mt-0.5">{localRecord.medicalHistory.detailed_info.bleeding_time || '—'}</p>
                          </div>

                          {/* Women Specifics */}
                          {localRecord.patient.gender === 'female' && (
                            <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                              <span className="text-[10px] text-gray-400 font-semibold uppercase block">Women-Only Specs</span>
                              <p className="font-semibold text-slate-700 mt-0.5">
                                Nursing: <span className="font-bold">{localRecord.medicalHistory.detailed_info.is_nursing ? "YES" : "NO"}</span> · 
                                Birth Control: <span className="font-bold">{localRecord.medicalHistory.detailed_info.is_birth_control ? "YES" : "NO"}</span>
                              </p>
                            </div>
                          )}

                          {/* Allergy checklist */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-gray-100 col-span-1 sm:col-span-2 md:col-span-3 space-y-1.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase block">Allergy Checklist Details</span>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-650">
                              <p><span className="font-bold text-slate-700">Local Anesthetic (Lidocaine):</span> {localRecord.medicalHistory.detailed_info.allergy_local_anesthetic ? 'YES' : 'NO'}</p>
                              <p><span className="font-bold text-slate-700">Penicillin / Antibiotics:</span> {localRecord.medicalHistory.detailed_info.allergy_penicillin ? 'YES' : 'NO'}</p>
                              <p><span className="font-bold text-slate-700">Sulfa Drugs:</span> {localRecord.medicalHistory.detailed_info.allergy_sulfa ? 'YES' : 'NO'}</p>
                              <p><span className="font-bold text-slate-700">Aspirin:</span> {localRecord.medicalHistory.detailed_info.allergy_aspirin ? 'YES' : 'NO'}</p>
                              <p><span className="font-bold text-slate-700">Latex:</span> {localRecord.medicalHistory.detailed_info.allergy_latex ? 'YES' : 'NO'}</p>
                              {localRecord.medicalHistory.detailed_info.allergy_other && (
                                <p className="w-full"><span className="font-bold text-slate-700">Other Allergies:</span> {localRecord.medicalHistory.detailed_info.allergy_other}</p>
                              )}
                            </div>
                          </div>

                          {/* Questionnaire */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-gray-100 col-span-1 sm:col-span-2 md:col-span-3 space-y-1.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase block">Health Questionnaire Responses</span>
                            <div className="space-y-1 text-slate-650">
                              <p>1. In good condition? <span className="font-bold text-slate-700 capitalize">{localRecord.medicalHistory.detailed_info.good_condition || '—'}</span></p>
                              <p>2. Under medical treatment? <span className="font-bold text-slate-700 capitalize">{localRecord.medicalHistory.detailed_info.under_medical_treatment || '—'}</span>
                                {localRecord.medicalHistory.detailed_info.under_medical_treatment === 'yes' && localRecord.medicalHistory.detailed_info.under_medical_treatment_desc && ` (${localRecord.medicalHistory.detailed_info.under_medical_treatment_desc})`}
                              </p>
                              <p>3. Serious illness or operation? <span className="font-bold text-slate-700 capitalize">{localRecord.medicalHistory.detailed_info.serious_illness_operation || '—'}</span>
                                {localRecord.medicalHistory.detailed_info.serious_illness_operation === 'yes' && localRecord.medicalHistory.detailed_info.serious_illness_operation_desc && ` (${localRecord.medicalHistory.detailed_info.serious_illness_operation_desc})`}
                              </p>
                              <p>4. Been hospitalized? <span className="font-bold text-slate-700 capitalize">{localRecord.medicalHistory.detailed_info.hospitalized || '—'}</span>
                                {localRecord.medicalHistory.detailed_info.hospitalized === 'yes' && localRecord.medicalHistory.detailed_info.hospitalized_desc && ` (${localRecord.medicalHistory.detailed_info.hospitalized_desc})`}
                              </p>
                              <p>5. Taking prescription/non-prescription meds? <span className="font-bold text-slate-700 capitalize">{localRecord.medicalHistory.detailed_info.prescription_medication || '—'}</span>
                                {localRecord.medicalHistory.detailed_info.prescription_medication === 'yes' && localRecord.medicalHistory.detailed_info.prescription_medication_desc && ` (${localRecord.medicalHistory.detailed_info.prescription_medication_desc})`}
                              </p>
                              <p>6. Uses alcohol / other drugs? <span className="font-bold text-slate-700 capitalize">{localRecord.medicalHistory.detailed_info.drug_use || '—'}</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Save button — dentist only */}
                    {viewerRole !== 'staff' && (
                      <div className="col-span-2 flex justify-end pt-2">
                        <button
                          onClick={handleSaveMedicalHistory}
                          disabled={isSavingMedHistory}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-50"
                        >
                          {isSavingMedHistory ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                          Save Changes
                        </button>
                      </div>
                    )}
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
            <DentalChartTab
              patientId={localRecord.patient.id}
              clinicId={clinicId ?? 0}
              dentalCharts={localRecord.dentalCharts}
              dentistId={dentistId}
              onRefresh={handleRefreshRecord}
            />
          )}

          {activeRecordTab === 'treatments' && (
            <TreatmentTab
              patientId={localRecord.patient.id}
              clinicId={clinicId ?? 0}
              dentistId={dentistId}
              treatments={localRecord.treatmentHistory || []}
              onRefresh={handleRefreshRecord}
            />
          )}

          {activeRecordTab === 'prescriptions' && (
            <PrescriptionsTab
              patientId={localRecord.patient.id}
              clinicId={clinicId ?? 0}
              dentistId={dentistId}
              prescriptions={localRecord.prescriptions || []}
              onRefresh={handleRefreshRecord}
              patient={{
                first_name: localRecord.patient.first_name,
                last_name: localRecord.patient.last_name,
                birthdate: localRecord.patient.birthdate,
                gender: localRecord.patient.gender,
              }}
            />
          )}

          {activeRecordTab === 'periodontal' && (
            <PeriodontalTab
              patientId={localRecord.patient.id}
              clinicId={clinicId ?? 0}
              dentistId={dentistId}
              screenings={localRecord.periodontalScreenings || []}
              tmjAssessments={localRecord.tmjAssessments || []}
              onRefresh={handleRefreshRecord}
            />
          )}

          {activeRecordTab === 'followups' && (
            <FollowupsTab
              patientId={localRecord.patient.id}
              clinicId={clinicId ?? 0}
              dentistId={dentistId}
              appointments={localRecord.appointments || []}
              onRefresh={handleRefreshRecord}
            />
          )}

          {activeRecordTab === 'photos' && (
            <PhotosTab
              patientId={localRecord.patient.id}
              viewerRole={viewerRole}
            />
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
