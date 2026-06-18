'use client'

import React, { useState } from 'react'
import { ClipboardList, FileText, HeartPulse, Edit2, Check, X, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PatientRecord } from './types'
import { formatDate } from './utils'
import { updatePatientMedicalHistory } from '@/actions/patientActions'
import { useRouter } from 'next/navigation'

interface MedicalTabProps {
  record: PatientRecord
}

export function MedicalTab({ record }: MedicalTabProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Form states
  const [bloodType, setBloodType] = useState(record.medicalHistory?.blood_type || '')
  const [bloodPressure, setBloodPressure] = useState(record.medicalHistory?.blood_pressure || '')
  const [medicalFlags, setMedicalFlags] = useState(record.medicalHistory?.medical_flags || '')
  const [allergiesText, setAllergiesText] = useState((record.medicalHistory?.allergies || []).join(', '))
  const [medicationsText, setMedicationsText] = useState((record.medicalHistory?.current_medications || []).join(', '))
  const [conditionsText, setConditionsText] = useState((record.medicalHistory?.medical_conditions || []).join(', '))
  const [previousSurgeries, setPreviousSurgeries] = useState(record.medicalHistory?.previous_surgeries || '')
  const [isSmoker, setIsSmoker] = useState(record.medicalHistory?.is_smoker || false)
  const [isPregnant, setIsPregnant] = useState(record.medicalHistory?.is_pregnant || false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')

    const allergies = allergiesText.split(',').map(s => s.trim()).filter(Boolean)
    const current_medications = medicationsText.split(',').map(s => s.trim()).filter(Boolean)
    const medical_conditions = conditionsText.split(',').map(s => s.trim()).filter(Boolean)

    const res = await updatePatientMedicalHistory(record.patient.id, {
      blood_type: bloodType || null,
      blood_pressure: bloodPressure || null,
      medical_flags: medicalFlags || null,
      allergies,
      current_medications,
      medical_conditions,
      previous_surgeries: previousSurgeries || null,
      is_pregnant: isPregnant,
      is_smoker: isSmoker,
      detailed_info: record.medicalHistory?.detailed_info || {}
    })

    setIsSubmitting(false)
    if (res.success) {
      setSuccessMsg('Medical history updated successfully!')
      setIsEditing(false)
      router.refresh()
    } else {
      setErrorMsg(res.error || 'Failed to update medical history.')
    }
  }

  const handleCancel = () => {
    setBloodType(record.medicalHistory?.blood_type || '')
    setBloodPressure(record.medicalHistory?.blood_pressure || '')
    setMedicalFlags(record.medicalHistory?.medical_flags || '')
    setAllergiesText((record.medicalHistory?.allergies || []).join(', '))
    setMedicationsText((record.medicalHistory?.current_medications || []).join(', '))
    setConditionsText((record.medicalHistory?.medical_conditions || []).join(', '))
    setPreviousSurgeries(record.medicalHistory?.previous_surgeries || '')
    setIsSmoker(record.medicalHistory?.is_smoker || false)
    setIsPregnant(record.medicalHistory?.is_pregnant || false)
    setIsEditing(false)
    setSuccessMsg('')
    setErrorMsg('')
  }

  return (
    <div className="space-y-6">
      {/* Medical History Summary Card */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <HeartPulse className="w-5 h-5 text-red-500" />
            Medical History Summary
          </CardTitle>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Summary
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-55 text-slate-600 rounded-lg text-xs font-bold transition"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition shadow-2xs"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {successMsg && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              {errorMsg}
            </div>
          )}

          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Blood Type</span>
                <span className="text-sm font-semibold text-slate-800 block mt-0.5">{record.medicalHistory?.blood_type || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Blood Pressure</span>
                <span className="text-sm font-semibold text-slate-800 block mt-0.5">{record.medicalHistory?.blood_pressure || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Medical Flags</span>
                <span className="text-sm font-semibold text-slate-800 block mt-0.5">{record.medicalHistory?.medical_flags || 'None'}</span>
              </div>
              
              <div className="md:col-span-3 border-t border-slate-100 my-2 pt-2"></div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Allergies</span>
                  <span className="text-sm font-medium text-slate-700 block mt-0.5">
                    {record.medicalHistory?.allergies?.length ? record.medicalHistory.allergies.join(', ') : 'None reported'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Medications</span>
                  <span className="text-sm font-medium text-slate-700 block mt-0.5">
                    {record.medicalHistory?.current_medications?.length ? record.medicalHistory.current_medications.join(', ') : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Medical Conditions</span>
                  <span className="text-sm font-medium text-slate-700 block mt-0.5">
                    {record.medicalHistory?.medical_conditions?.length ? record.medicalHistory.medical_conditions.join(', ') : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Previous Surgeries</span>
                  <span className="text-sm font-medium text-slate-700 block mt-0.5">{record.medicalHistory?.previous_surgeries || 'None'}</span>
                </div>
              </div>

              <div className="md:col-span-3 border-t border-slate-100 my-2 pt-2"></div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lifestyle / Status</span>
                <div className="flex gap-4 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${record.medicalHistory?.is_smoker ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                    {record.medicalHistory?.is_smoker ? 'Smoker' : 'Non-Smoker'}
                  </span>
                  {record.patient.gender?.toLowerCase() === 'female' && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${record.medicalHistory?.is_pregnant ? 'bg-pink-50 text-pink-700' : 'bg-slate-100 text-slate-500'}`}>
                      {record.medicalHistory?.is_pregnant ? 'Pregnant' : 'Not Pregnant'}
                    </span>
                  )}
                </div>
              </div>

              {record.medicalHistory && (
                <div className="md:col-span-3 text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                  Last updated: {record.medicalHistory.updated_at ? new Date(record.medicalHistory.updated_at).toLocaleString() : '—'}
                  {record.medicalHistory.detailed_info?.updated_by && ` by ${record.medicalHistory.detailed_info.updated_by}`}
                  {record.medicalHistory.detailed_info?.updated_by_branch && ` (${record.medicalHistory.detailed_info.updated_by_branch})`}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Blood Type</label>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none font-semibold text-slate-800 focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Unknown</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Blood Pressure</label>
                <input
                  type="text"
                  placeholder="e.g. 120/80 mmHg"
                  value={bloodPressure}
                  onChange={e => setBloodPressure(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none font-semibold text-slate-800 focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Medical Flags</label>
                <input
                  type="text"
                  placeholder="e.g. High Risk / Heart Condition"
                  value={medicalFlags}
                  onChange={e => setMedicalFlags(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none font-semibold text-slate-800 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Allergies (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Latex, Peanuts"
                    value={allergiesText}
                    onChange={e => setAllergiesText(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none text-slate-800 focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Medications (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Aspirin 81mg, Metformin"
                    value={medicationsText}
                    onChange={e => setMedicationsText(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none text-slate-800 focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Medical Conditions (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Diabetes, Hypertension"
                    value={conditionsText}
                    onChange={e => setConditionsText(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none text-slate-800 focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Previous Surgeries</label>
                  <input
                    type="text"
                    placeholder="e.g. Appendectomy (2018)"
                    value={previousSurgeries}
                    onChange={e => setPreviousSurgeries(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none text-slate-800 focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="md:col-span-3 flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSmoker}
                    onChange={e => setIsSmoker(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 border-slate-350 focus:ring-red-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">I am a Smoker</span>
                </label>
                {record.patient.gender?.toLowerCase() === 'female' && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPregnant}
                      onChange={e => setIsPregnant(e.target.checked)}
                      className="w-4 h-4 rounded text-red-500 border-slate-355 focus:ring-red-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700">I am Pregnant</span>
                  </label>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Treatment History List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Performed Treatments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {record.treatmentHistory.length > 0 ? (
            record.treatmentHistory.map((tr: any) => (
              <div key={tr.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-900">{tr.services?.name}</h5>
                    <p className="text-xs text-slate-500 mt-1">Performed by: Dr. {tr.dentists?.first_name} {tr.dentists?.last_name}</p>
                  </div>
                  <span className="text-sm font-extrabold text-blue-650">PHP {tr.services?.price?.toLocaleString()}</span>
                </div>
                {tr.notes && <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">{tr.notes}</p>}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">No treatments performed yet</p>
          )}
        </CardContent>
      </Card>

      {/* Prescriptions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <FileText className="w-5 h-5 text-blue-600" />
            Active Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {record.prescriptions.length > 0 ? (
            record.prescriptions.map((pr: any) => (
              <div key={pr.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-900">{pr.medication_name || 'Prescription'}</h5>
                    <p className="text-xs text-slate-500 mt-1">Dr. {pr.dentists?.first_name} {pr.dentists?.last_name}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(pr.prescribed_at)}</span>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <p><span className="font-semibold text-slate-500">Dosage: </span>{pr.dosage || 'As indicated'}</p>
                  {pr.instructions && <p><span className="font-semibold text-slate-500">Instructions: </span>{pr.instructions}</p>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">No active prescriptions</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
