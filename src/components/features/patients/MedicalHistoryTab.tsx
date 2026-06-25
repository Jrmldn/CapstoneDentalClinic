'use client'

import { RefreshCw } from 'lucide-react'
import { formatPhone } from '@/utils/phone-helpers'
import { formatDateTime } from '@/lib/date'
import type { PatientRecord } from './types'
import type { MedicalHistoryEditState } from './usePatientRecord'

interface MedicalHistoryTabProps {
  localRecord: PatientRecord
  viewerRole: 'dentist' | 'staff'
  lastVisitDate: string
  medHistory: MedicalHistoryEditState
}

export default function MedicalHistoryTab({ localRecord, viewerRole, lastVisitDate, medHistory }: MedicalHistoryTabProps) {
  const now = Date.now()
  const {
    editBloodType, setEditBloodType,
    editBloodPressure, setEditBloodPressure,
    editMedicalFlags, setEditMedicalFlags,
    editAllergies, setEditAllergies,
    editCurrentMeds, setEditCurrentMeds,
    editMedConditions, setEditMedConditions,
    editIsPregnant, setEditIsPregnant,
    editIsSmoker, setEditIsSmoker,
    isSavingMedHistory, onSave,
  } = medHistory

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs grid grid-cols-3 gap-4">
        <div className="col-span-3 flex justify-between items-center border-b border-gray-100 pb-1 mb-2">
          <h4 className="font-bold text-slate-900 text-sm">Personal Details</h4>
          {localRecord.medicalHistory?.detailed_info?.profile_updated_by ? (
            <span className="text-[10px] text-gray-400 font-medium">
              Last updated: {formatDateTime(localRecord.medicalHistory.detailed_info.profile_updated_at)}
              {` by ${localRecord.medicalHistory.detailed_info.profile_updated_by}`}
              {localRecord.medicalHistory.detailed_info.profile_updated_by_branch && ` (${localRecord.medicalHistory.detailed_info.profile_updated_by_branch})`}
            </span>
          ) : (
            localRecord.patient.updated_at && (
              <span className="text-[10px] text-gray-400 font-medium">
                Last updated: {formatDateTime(localRecord.patient.updated_at)}
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
          <span className="text-sm font-medium text-slate-800">{localRecord.patient.previous_dentist || 'None'}</span>
        </div>
        <div className="col-span-3">
          <span className="text-[10px] text-gray-400 block font-semibold">ADDRESS</span>
          <span className="text-sm font-medium text-slate-800">{localRecord.patient.address || '—'}</span>
        </div>

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
                <span className="text-xs font-semibold text-slate-800">{localRecord.patient.guardian_name || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">GUARDIAN PHONE</span>
                <span className="text-xs font-semibold text-slate-800">{localRecord.patient.guardian_phone || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 block font-semibold">GUARDIAN ADDRESS</span>
                <span className="text-xs font-semibold text-slate-800">{localRecord.patient.guardian_address || '—'}</span>
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
              Last updated: {formatDateTime(localRecord.medicalHistory.updated_at)}
              {localRecord.medicalHistory.detailed_info?.updated_by && ` by ${localRecord.medicalHistory.detailed_info.updated_by}`}
              {localRecord.medicalHistory.detailed_info?.updated_by_branch && ` (${localRecord.medicalHistory.detailed_info.updated_by_branch})`}
            </span>
          )}
        </div>
        {localRecord.medicalHistory ? (
          <>
            <div className="space-y-4">
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

            <div className="space-y-4">
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

            {localRecord.medicalHistory.detailed_info && (
              <div className="col-span-2 border-t border-gray-100 pt-4 mt-2 space-y-4">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Detailed Medical History Questionnaire</h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100 col-span-1 sm:col-span-2 md:col-span-3 space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Primary Physician Details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
                      <p className="text-slate-600"><span className="font-bold text-slate-700">Name:</span> {localRecord.medicalHistory.detailed_info.physician_name || '—'}</p>
                      <p className="text-slate-600"><span className="font-bold text-slate-700">Office Address:</span> {localRecord.medicalHistory.detailed_info.physician_office_address || '—'}</p>
                      <p className="text-slate-600"><span className="font-bold text-slate-700">Office Phone:</span> {localRecord.medicalHistory.detailed_info.physician_office_phone || '—'}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Last Dental Visit</span>
                    <p className="font-bold text-slate-800 mt-0.5">{localRecord.medicalHistory.detailed_info.last_dental_visit || '—'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Bleeding Time</span>
                    <p className="font-bold text-slate-800 mt-0.5">{localRecord.medicalHistory.detailed_info.bleeding_time || '—'}</p>
                  </div>

                  {localRecord.patient.gender === 'female' && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase block">Women-Only Specs</span>
                      <p className="font-semibold text-slate-700 mt-0.5">
                        Nursing: <span className="font-bold">{localRecord.medicalHistory.detailed_info.is_nursing ? "YES" : "NO"}</span> ·{' '}
                        Birth Control: <span className="font-bold">{localRecord.medicalHistory.detailed_info.is_birth_control ? "YES" : "NO"}</span>
                      </p>
                    </div>
                  )}

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

            {viewerRole !== 'staff' && (
              <div className="col-span-2 flex justify-end pt-2">
                <button
                  onClick={onSave}
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
  )
}
