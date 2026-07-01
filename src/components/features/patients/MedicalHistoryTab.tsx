'use client'

import { RefreshCw } from 'lucide-react'
import { formatPhone } from '@/utils/phone-helpers'
import { formatDateTime } from '@/lib/date'
import type { PatientRecord } from './types'
import type { MedicalHistoryEditState } from './usePatientRecord'

interface MedicalHistoryTabProps {
  localRecord: PatientRecord
  viewerRole: 'dentist' | 'staff' | 'superadmin'
  lastVisitDate: string
  medHistory: MedicalHistoryEditState
  readOnly?: boolean
  showSaveButton?: boolean
}

interface YesNoToggleProps {
  value: string
  onChange: (value: 'yes' | 'no') => void
}

function YesNoToggle({ value, onChange }: YesNoToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('yes')}
        className={`px-4 py-1.5 text-xs font-bold transition-colors ${
          value === 'yes' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange('no')}
        className={`px-4 py-1.5 text-xs font-bold border-l border-gray-200 transition-colors ${
          value === 'no' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        No
      </button>
    </div>
  )
}

interface YesNoQuestionFieldProps {
  value: string
  onChange: (v: string) => void
  desc: string
  onDescChange: (v: string) => void
  descPlaceholder: string
}

function YesNoQuestionField({ value, onChange, desc, onDescChange, descPlaceholder }: YesNoQuestionFieldProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <YesNoToggle value={value} onChange={onChange} />
      {value === 'yes' && (
        <input
          type="text"
          placeholder={descPlaceholder}
          value={desc}
          onChange={e => onDescChange(e.target.value)}
          className="flex-1 px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
        />
      )}
    </div>
  )
}

function autoGrowTextarea(e: React.FormEvent<HTMLTextAreaElement>) {
  const el = e.currentTarget
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

export default function MedicalHistoryTab({
  localRecord,
  lastVisitDate,
  medHistory,
  readOnly = false,
  showSaveButton = true,
}: MedicalHistoryTabProps) {
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
    editPhysicianName, setEditPhysicianName,
    editPhysicianOfficeAddress, setEditPhysicianOfficeAddress,
    editPhysicianOfficePhone, setEditPhysicianOfficePhone,
    editLastDentalVisit, setEditLastDentalVisit,
    editBleedingTime, setEditBleedingTime,
    editIsNursing, setEditIsNursing,
    editIsBirthControl, setEditIsBirthControl,
    editAllergyLocalAnesthetic, setEditAllergyLocalAnesthetic,
    editAllergyPenicillin, setEditAllergyPenicillin,
    editAllergySulfa, setEditAllergySulfa,
    editAllergyAspirin, setEditAllergyAspirin,
    editAllergyLatex, setEditAllergyLatex,
    editAllergyOther, setEditAllergyOther,
    editGoodCondition, setEditGoodCondition,
    editUnderMedicalTreatment, setEditUnderMedicalTreatment,
    editUnderMedicalTreatmentDesc, setEditUnderMedicalTreatmentDesc,
    editSeriousIllnessOperation, setEditSeriousIllnessOperation,
    editSeriousIllnessOperationDesc, setEditSeriousIllnessOperationDesc,
    editHospitalized, setEditHospitalized,
    editHospitalizedDesc, setEditHospitalizedDesc,
    editPrescriptionMedication, setEditPrescriptionMedication,
    editPrescriptionMedicationDesc, setEditPrescriptionMedicationDesc,
    editDrugUse, setEditDrugUse,
    isSavingMedHistory, isEditing, onEdit, onCancel, onSave,
  } = medHistory

  const isReadOnly = readOnly || !isEditing
  const mh = localRecord.medicalHistory

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="col-span-2 sm:col-span-3 flex justify-between items-center border-b border-gray-100 pb-1 mb-2">
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
        <div className="min-w-0">
          <span className="text-[10px] text-gray-400 block font-semibold">GENDER</span>
          <span className="text-sm font-medium capitalize text-slate-800 break-words">{localRecord.patient.gender}</span>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-gray-400 block font-semibold">BIRTHDATE</span>
          <span className="text-sm font-medium text-slate-800 break-words">{localRecord.patient.birthdate}</span>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-gray-400 block font-semibold">PHONE</span>
          <span className="text-sm font-medium text-slate-800 break-words">{formatPhone(localRecord.patient.phone)}</span>
        </div>
        {localRecord.patient.email && (
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 block font-semibold">EMAIL</span>
            <span className="text-sm font-medium text-slate-800 break-words">{localRecord.patient.email}</span>
          </div>
        )}
        <div className="min-w-0">
          <span className="text-[10px] text-gray-400 block font-semibold">LAST VISIT</span>
          <span className="text-sm font-semibold text-blue-600 break-words">{lastVisitDate}</span>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-gray-400 block font-semibold">PREVIOUS DENTIST</span>
          <span className="text-sm font-medium text-slate-800 break-words">{localRecord.patient.previous_dentist || 'None'}</span>
        </div>
        <div className="col-span-2 sm:col-span-3 min-w-0">
          <span className="text-[10px] text-gray-400 block font-semibold">ADDRESS</span>
          <span className="text-sm font-medium text-slate-800 break-words">{localRecord.patient.address || '—'}</span>
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
          <div className="flex items-center gap-3">
            {mh && (
              <span className="text-[10px] text-gray-400 font-medium">
                Last updated: {formatDateTime(mh.updated_at)}
                {mh.detailed_info?.updated_by && ` by ${mh.detailed_info.updated_by}`}
                {mh.detailed_info?.updated_by_branch && ` (${mh.detailed_info.updated_by_branch})`}
              </span>
            )}
            {!readOnly && !isEditing && (
              <button
                onClick={onEdit}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition"
              >
                Edit
              </button>
            )}
          </div>
        </div>
        <div className="space-y-4">
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">BLOOD TYPE</span>
                {isReadOnly ? (
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                    {mh?.blood_type || 'Unknown'}
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
                {isReadOnly ? (
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                    {mh?.blood_pressure || '—'}
                  </span>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. 120/80 mmHg"
                    value={editBloodPressure}
                    onChange={e => setEditBloodPressure(e.target.value)}
                    className="mt-0.5 w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                  />
                )}
              </div>

              {localRecord.patient.gender === 'female' && (
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">PREGNANCY STATUS</span>
                  {isReadOnly ? (
                    <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                      {mh?.is_pregnant ? 'Pregnant' : 'Not Pregnant'}
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
                {isReadOnly ? (
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                    {mh?.is_smoker ? 'Smoker' : 'Non-smoker'}
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
                {isReadOnly ? (
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                    {(mh?.allergies?.length ?? 0) > 0
                      ? mh?.allergies?.join(', ')
                      : 'No allergies listed'}
                  </span>
                ) : (
                  <textarea
                    placeholder="e.g. Penicillin, Peanuts (comma-separated)"
                    value={editAllergies}
                    onChange={e => setEditAllergies(e.target.value)}
                    onInput={autoGrowTextarea}
                    rows={1}
                    className="mt-0.5 w-full min-h-[42px] px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800 resize-none"
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">MEDICAL FLAGS</span>
                {isReadOnly ? (
                  <span className="text-sm font-bold mt-0.5 block text-slate-800">
                    {mh?.medical_flags || 'None'}
                  </span>
                ) : (
                  <textarea
                    placeholder="e.g. Penicillin allergy, Latex"
                    value={editMedicalFlags}
                    onChange={e => setEditMedicalFlags(e.target.value)}
                    onInput={autoGrowTextarea}
                    rows={1}
                    className="mt-0.5 w-full min-h-[42px] px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800 placeholder:text-gray-300 resize-none"
                  />
                )}
              </div>

              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">CURRENT MEDICATIONS</span>
                {isReadOnly ? (
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                    {(mh?.current_medications?.length ?? 0) > 0
                      ? mh?.current_medications?.join(', ')
                      : 'None listed'}
                  </span>
                ) : (
                  <textarea
                    placeholder="e.g. Insulin, Metformin (comma-separated)"
                    value={editCurrentMeds}
                    onChange={e => setEditCurrentMeds(e.target.value)}
                    onInput={autoGrowTextarea}
                    rows={1}
                    className="mt-0.5 w-full min-h-[42px] px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800 resize-none"
                  />
                )}
              </div>

              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">MEDICAL CONDITIONS</span>
                {isReadOnly ? (
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                    {(mh?.medical_conditions?.length ?? 0) > 0
                      ? mh?.medical_conditions?.join(', ')
                      : 'None listed'}
                  </span>
                ) : (
                  <textarea
                    placeholder="e.g. Diabetes, Hypertension (comma-separated)"
                    value={editMedConditions}
                    onChange={e => setEditMedConditions(e.target.value)}
                    onInput={autoGrowTextarea}
                    rows={1}
                    className="mt-0.5 w-full min-h-[42px] px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800 resize-none"
                  />
                )}
              </div>
            </div>

            <div className="col-span-2 border-t border-gray-100 pt-4 mt-2 space-y-4">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Detailed Medical History Questionnaire</h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100 col-span-1 sm:col-span-2 md:col-span-3 space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Primary Physician Details</span>
                    {isReadOnly ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
                        <p className="text-slate-600"><span className="font-bold text-slate-700">Name:</span> {mh?.detailed_info?.physician_name || '—'}</p>
                        <p className="text-slate-600"><span className="font-bold text-slate-700">Office Address:</span> {mh?.detailed_info?.physician_office_address || '—'}</p>
                        <p className="text-slate-600"><span className="font-bold text-slate-700">Office Phone:</span> {mh?.detailed_info?.physician_office_phone || '—'}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Physician name"
                          value={editPhysicianName}
                          onChange={e => setEditPhysicianName(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                        />
                        <input
                          type="text"
                          placeholder="Office address"
                          value={editPhysicianOfficeAddress}
                          onChange={e => setEditPhysicianOfficeAddress(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                        />
                        <input
                          type="text"
                          placeholder="Office phone"
                          value={editPhysicianOfficePhone}
                          onChange={e => setEditPhysicianOfficePhone(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Last Dental Visit</span>
                    {isReadOnly ? (
                      <p className="font-bold text-slate-800 mt-0.5">{mh?.detailed_info?.last_dental_visit || '—'}</p>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. 2025-01-15"
                        value={editLastDentalVisit}
                        onChange={e => setEditLastDentalVisit(e.target.value)}
                        className="mt-0.5 w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                      />
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Bleeding Time</span>
                    {isReadOnly ? (
                      <p className="font-bold text-slate-800 mt-0.5">{mh?.detailed_info?.bleeding_time || '—'}</p>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. 2-5 minutes"
                        value={editBleedingTime}
                        onChange={e => setEditBleedingTime(e.target.value)}
                        className="mt-0.5 w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                      />
                    )}
                  </div>

                  {localRecord.patient.gender === 'female' && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase block">Women-Only Specs</span>
                      {isReadOnly ? (
                        <p className="font-semibold text-slate-700 mt-0.5">
                          Nursing: <span className="font-bold">{mh?.detailed_info?.is_nursing ? "YES" : "NO"}</span> ·{' '}
                          Birth Control: <span className="font-bold">{mh?.detailed_info?.is_birth_control ? "YES" : "NO"}</span>
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={editIsNursing} onChange={e => setEditIsNursing(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                            <span className="text-xs font-semibold text-slate-700">Nursing</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={editIsBirthControl} onChange={e => setEditIsBirthControl(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                            <span className="text-xs font-semibold text-slate-700">Birth Control</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100 col-span-1 sm:col-span-2 md:col-span-3 space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Allergy Checklist Details</span>
                    {isReadOnly ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-650">
                        <p><span className="font-bold text-slate-700">Local Anesthetic (Lidocaine):</span> {mh?.detailed_info?.allergy_local_anesthetic ? 'YES' : 'NO'}</p>
                        <p><span className="font-bold text-slate-700">Penicillin / Antibiotics:</span> {mh?.detailed_info?.allergy_penicillin ? 'YES' : 'NO'}</p>
                        <p><span className="font-bold text-slate-700">Sulfa Drugs:</span> {mh?.detailed_info?.allergy_sulfa ? 'YES' : 'NO'}</p>
                        <p><span className="font-bold text-slate-700">Aspirin:</span> {mh?.detailed_info?.allergy_aspirin ? 'YES' : 'NO'}</p>
                        <p><span className="font-bold text-slate-700">Latex:</span> {mh?.detailed_info?.allergy_latex ? 'YES' : 'NO'}</p>
                        {mh?.detailed_info?.allergy_other && (
                          <p className="w-full"><span className="font-bold text-slate-700">Other Allergies:</span> {mh?.detailed_info?.allergy_other}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={editAllergyLocalAnesthetic} onChange={e => setEditAllergyLocalAnesthetic(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                            <span className="text-xs font-semibold text-slate-700">Local Anesthetic (Lidocaine)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={editAllergyPenicillin} onChange={e => setEditAllergyPenicillin(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                            <span className="text-xs font-semibold text-slate-700">Penicillin / Antibiotics</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={editAllergySulfa} onChange={e => setEditAllergySulfa(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                            <span className="text-xs font-semibold text-slate-700">Sulfa Drugs</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={editAllergyAspirin} onChange={e => setEditAllergyAspirin(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                            <span className="text-xs font-semibold text-slate-700">Aspirin</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={editAllergyLatex} onChange={e => setEditAllergyLatex(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                            <span className="text-xs font-semibold text-slate-700">Latex</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Other allergies"
                          value={editAllergyOther}
                          onChange={e => setEditAllergyOther(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100 col-span-1 sm:col-span-2 md:col-span-3 space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Health Questionnaire Responses</span>
                    {isReadOnly ? (
                      <div className="space-y-1 text-slate-650">
                        <p>1. In good condition? <span className="font-bold text-slate-700 capitalize">{mh?.detailed_info?.good_condition || '—'}</span></p>
                        <p>2. Under medical treatment? <span className="font-bold text-slate-700 capitalize">{mh?.detailed_info?.under_medical_treatment || '—'}</span>
                          {mh?.detailed_info?.under_medical_treatment === 'yes' && mh?.detailed_info?.under_medical_treatment_desc && ` (${mh?.detailed_info?.under_medical_treatment_desc})`}
                        </p>
                        <p>3. Serious illness or operation? <span className="font-bold text-slate-700 capitalize">{mh?.detailed_info?.serious_illness_operation || '—'}</span>
                          {mh?.detailed_info?.serious_illness_operation === 'yes' && mh?.detailed_info?.serious_illness_operation_desc && ` (${mh?.detailed_info?.serious_illness_operation_desc})`}
                        </p>
                        <p>4. Been hospitalized? <span className="font-bold text-slate-700 capitalize">{mh?.detailed_info?.hospitalized || '—'}</span>
                          {mh?.detailed_info?.hospitalized === 'yes' && mh?.detailed_info?.hospitalized_desc && ` (${mh?.detailed_info?.hospitalized_desc})`}
                        </p>
                        <p>5. Taking prescription/non-prescription meds? <span className="font-bold text-slate-700 capitalize">{mh?.detailed_info?.prescription_medication || '—'}</span>
                          {mh?.detailed_info?.prescription_medication === 'yes' && mh?.detailed_info?.prescription_medication_desc && ` (${mh?.detailed_info?.prescription_medication_desc})`}
                        </p>
                        <p>6. Uses alcohol / other drugs? <span className="font-bold text-slate-700 capitalize">{mh?.detailed_info?.drug_use || '—'}</span></p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div>
                          <span className="text-[11px] text-slate-600 font-semibold block mb-1">1. In good condition?</span>
                          <YesNoToggle value={editGoodCondition} onChange={setEditGoodCondition} />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-600 font-semibold block mb-1">2. Under medical treatment?</span>
                          <YesNoQuestionField
                            value={editUnderMedicalTreatment}
                            onChange={setEditUnderMedicalTreatment}
                            desc={editUnderMedicalTreatmentDesc}
                            onDescChange={setEditUnderMedicalTreatmentDesc}
                            descPlaceholder="Describe treatment"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-600 font-semibold block mb-1">3. Serious illness or operation?</span>
                          <YesNoQuestionField
                            value={editSeriousIllnessOperation}
                            onChange={setEditSeriousIllnessOperation}
                            desc={editSeriousIllnessOperationDesc}
                            onDescChange={setEditSeriousIllnessOperationDesc}
                            descPlaceholder="Describe illness/operation"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-600 font-semibold block mb-1">4. Been hospitalized?</span>
                          <YesNoQuestionField
                            value={editHospitalized}
                            onChange={setEditHospitalized}
                            desc={editHospitalizedDesc}
                            onDescChange={setEditHospitalizedDesc}
                            descPlaceholder="Describe hospitalization"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-600 font-semibold block mb-1">5. Taking prescription/non-prescription meds?</span>
                          <YesNoQuestionField
                            value={editPrescriptionMedication}
                            onChange={setEditPrescriptionMedication}
                            desc={editPrescriptionMedicationDesc}
                            onDescChange={setEditPrescriptionMedicationDesc}
                            descPlaceholder="Describe medication"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-600 font-semibold block mb-1">6. Uses alcohol / other drugs?</span>
                          <input
                            type="text"
                            placeholder="e.g. No, Occasionally"
                            value={editDrugUse}
                            onChange={e => setEditDrugUse(e.target.value)}
                            className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            {!isReadOnly && showSaveButton && (
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button
                  onClick={onCancel}
                  disabled={isSavingMedHistory}
                  className="px-4 py-1.5 border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-100 transition font-bold text-xs disabled:opacity-50"
                >
                  Cancel
                </button>
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
      </div>
    </div>
  )
}
