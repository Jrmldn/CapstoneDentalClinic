'use client'

import { useState, useEffect } from 'react'
import { fetchPatientRecord, updatePatientMedicalHistory } from '@/actions/patientMedicalActions'
import { addClinicalAssessment } from '@/actions/clinicalRecordActions'
import { formatDate } from '@/lib/date'
import type { PatientRecord } from './types'

export interface MedicalHistoryEditState {
  editBloodType: string
  setEditBloodType: (v: string) => void
  editBloodPressure: string
  setEditBloodPressure: (v: string) => void
  editMedicalFlags: string
  setEditMedicalFlags: (v: string) => void
  editAllergies: string
  setEditAllergies: (v: string) => void
  editCurrentMeds: string
  setEditCurrentMeds: (v: string) => void
  editMedConditions: string
  setEditMedConditions: (v: string) => void
  editIsPregnant: boolean
  setEditIsPregnant: (v: boolean) => void
  editIsSmoker: boolean
  setEditIsSmoker: (v: boolean) => void
  editPhysicianName: string
  setEditPhysicianName: (v: string) => void
  editPhysicianOfficeAddress: string
  setEditPhysicianOfficeAddress: (v: string) => void
  editPhysicianOfficePhone: string
  setEditPhysicianOfficePhone: (v: string) => void
  editLastDentalVisit: string
  setEditLastDentalVisit: (v: string) => void
  editBleedingTime: string
  setEditBleedingTime: (v: string) => void
  editIsNursing: boolean
  setEditIsNursing: (v: boolean) => void
  editIsBirthControl: boolean
  setEditIsBirthControl: (v: boolean) => void
  editAllergyLocalAnesthetic: boolean
  setEditAllergyLocalAnesthetic: (v: boolean) => void
  editAllergyPenicillin: boolean
  setEditAllergyPenicillin: (v: boolean) => void
  editAllergySulfa: boolean
  setEditAllergySulfa: (v: boolean) => void
  editAllergyAspirin: boolean
  setEditAllergyAspirin: (v: boolean) => void
  editAllergyLatex: boolean
  setEditAllergyLatex: (v: boolean) => void
  editAllergyOther: string
  setEditAllergyOther: (v: string) => void
  editGoodCondition: string
  setEditGoodCondition: (v: string) => void
  editUnderMedicalTreatment: string
  setEditUnderMedicalTreatment: (v: string) => void
  editUnderMedicalTreatmentDesc: string
  setEditUnderMedicalTreatmentDesc: (v: string) => void
  editSeriousIllnessOperation: string
  setEditSeriousIllnessOperation: (v: string) => void
  editSeriousIllnessOperationDesc: string
  setEditSeriousIllnessOperationDesc: (v: string) => void
  editHospitalized: string
  setEditHospitalized: (v: string) => void
  editHospitalizedDesc: string
  setEditHospitalizedDesc: (v: string) => void
  editPrescriptionMedication: string
  setEditPrescriptionMedication: (v: string) => void
  editPrescriptionMedicationDesc: string
  setEditPrescriptionMedicationDesc: (v: string) => void
  editDrugUse: string
  setEditDrugUse: (v: string) => void
  isSavingMedHistory: boolean
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

export interface UsePatientRecordReturn {
  localRecord: PatientRecord | null
  isRefreshing: boolean
  lastVisitDate: string
  showAssessmentForm: boolean
  setShowAssessmentForm: (v: boolean) => void
  chiefComplaint: string
  setChiefComplaint: (v: string) => void
  diagnosis: string
  setDiagnosis: (v: string) => void
  treatmentPlan: string
  setTreatmentPlan: (v: string) => void
  assessmentNotes: string
  setAssessmentNotes: (v: string) => void
  isSubmittingAssessment: boolean
  medHistory: MedicalHistoryEditState
  handleRefreshRecord: () => Promise<void>
  handleAddAssessmentSubmit: (e: React.FormEvent) => Promise<void>
}

export function usePatientRecord(
  record: PatientRecord | null,
  clinicId?: number,
  dentistId?: number
): UsePatientRecordReturn {
  const [localRecord, setLocalRecord] = useState<PatientRecord | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [showAssessmentForm, setShowAssessmentForm] = useState(false)
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [assessmentNotes, setAssessmentNotes] = useState('')
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false)

  const [editBloodType, setEditBloodType] = useState('')
  const [editBloodPressure, setEditBloodPressure] = useState('')
  const [editMedicalFlags, setEditMedicalFlags] = useState('')
  const [editAllergies, setEditAllergies] = useState('')
  const [editCurrentMeds, setEditCurrentMeds] = useState('')
  const [editMedConditions, setEditMedConditions] = useState('')
  const [editIsPregnant, setEditIsPregnant] = useState(false)
  const [editIsSmoker, setEditIsSmoker] = useState(false)
  const [editPhysicianName, setEditPhysicianName] = useState('')
  const [editPhysicianOfficeAddress, setEditPhysicianOfficeAddress] = useState('')
  const [editPhysicianOfficePhone, setEditPhysicianOfficePhone] = useState('')
  const [editLastDentalVisit, setEditLastDentalVisit] = useState('')
  const [editBleedingTime, setEditBleedingTime] = useState('')
  const [editIsNursing, setEditIsNursing] = useState(false)
  const [editIsBirthControl, setEditIsBirthControl] = useState(false)
  const [editAllergyLocalAnesthetic, setEditAllergyLocalAnesthetic] = useState(false)
  const [editAllergyPenicillin, setEditAllergyPenicillin] = useState(false)
  const [editAllergySulfa, setEditAllergySulfa] = useState(false)
  const [editAllergyAspirin, setEditAllergyAspirin] = useState(false)
  const [editAllergyLatex, setEditAllergyLatex] = useState(false)
  const [editAllergyOther, setEditAllergyOther] = useState('')
  const [editGoodCondition, setEditGoodCondition] = useState('')
  const [editUnderMedicalTreatment, setEditUnderMedicalTreatment] = useState('')
  const [editUnderMedicalTreatmentDesc, setEditUnderMedicalTreatmentDesc] = useState('')
  const [editSeriousIllnessOperation, setEditSeriousIllnessOperation] = useState('')
  const [editSeriousIllnessOperationDesc, setEditSeriousIllnessOperationDesc] = useState('')
  const [editHospitalized, setEditHospitalized] = useState('')
  const [editHospitalizedDesc, setEditHospitalizedDesc] = useState('')
  const [editPrescriptionMedication, setEditPrescriptionMedication] = useState('')
  const [editPrescriptionMedicationDesc, setEditPrescriptionMedicationDesc] = useState('')
  const [editDrugUse, setEditDrugUse] = useState('')
  const [isSavingMedHistory, setIsSavingMedHistory] = useState(false)
  const [isEditingMedHistory, setIsEditingMedHistory] = useState(false)

  const resetMedHistoryFields = (mh: PatientRecord['medicalHistory'] | undefined) => {
    setEditBloodType(mh?.blood_type || '')
    setEditBloodPressure(mh?.blood_pressure || '')
    setEditMedicalFlags(mh?.medical_flags || '')
    setEditAllergies(mh?.allergies?.join(', ') || '')
    setEditCurrentMeds(mh?.current_medications?.join(', ') || '')
    setEditMedConditions(mh?.medical_conditions?.join(', ') || '')
    setEditIsPregnant(mh?.is_pregnant || false)
    setEditIsSmoker(mh?.is_smoker || false)
    const di = mh?.detailed_info
    setEditPhysicianName(di?.physician_name || '')
    setEditPhysicianOfficeAddress(di?.physician_office_address || '')
    setEditPhysicianOfficePhone(di?.physician_office_phone || '')
    setEditLastDentalVisit(di?.last_dental_visit || '')
    setEditBleedingTime(di?.bleeding_time || '')
    setEditIsNursing(di?.is_nursing || false)
    setEditIsBirthControl(di?.is_birth_control || false)
    setEditAllergyLocalAnesthetic(di?.allergy_local_anesthetic || false)
    setEditAllergyPenicillin(di?.allergy_penicillin || false)
    setEditAllergySulfa(di?.allergy_sulfa || false)
    setEditAllergyAspirin(di?.allergy_aspirin || false)
    setEditAllergyLatex(di?.allergy_latex || false)
    setEditAllergyOther(di?.allergy_other || '')
    setEditGoodCondition(di?.good_condition || '')
    setEditUnderMedicalTreatment(di?.under_medical_treatment || '')
    setEditUnderMedicalTreatmentDesc(di?.under_medical_treatment_desc || '')
    setEditSeriousIllnessOperation(di?.serious_illness_operation || '')
    setEditSeriousIllnessOperationDesc(di?.serious_illness_operation_desc || '')
    setEditHospitalized(di?.hospitalized || '')
    setEditHospitalizedDesc(di?.hospitalized_desc || '')
    setEditPrescriptionMedication(di?.prescription_medication || '')
    setEditPrescriptionMedicationDesc(di?.prescription_medication_desc || '')
    setEditDrugUse(di?.drug_use || '')
  }

  useEffect(() => {
    setLocalRecord(record)
    resetMedHistoryFields(record?.medicalHistory)
    setIsEditingMedHistory(false)
  }, [record])

  const handleCancelMedicalHistory = () => {
    resetMedHistoryFields(localRecord?.medicalHistory)
    setIsEditingMedHistory(false)
  }

  const handleRefreshRecord = async () => {
    if (!localRecord) return
    setIsRefreshing(true)
    const res = await fetchPatientRecord(localRecord.patient.id, clinicId)
    setIsRefreshing(false)
    if (res.success && res.record) {
      setLocalRecord(res.record as PatientRecord)
    }
  }

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
      detailed_info: {
        physician_name: editPhysicianName || null,
        physician_office_address: editPhysicianOfficeAddress || null,
        physician_office_phone: editPhysicianOfficePhone || null,
        last_dental_visit: editLastDentalVisit || null,
        bleeding_time: editBleedingTime || null,
        is_nursing: editIsNursing,
        is_birth_control: editIsBirthControl,
        allergy_local_anesthetic: editAllergyLocalAnesthetic,
        allergy_penicillin: editAllergyPenicillin,
        allergy_sulfa: editAllergySulfa,
        allergy_aspirin: editAllergyAspirin,
        allergy_latex: editAllergyLatex,
        allergy_other: editAllergyOther || null,
        good_condition: editGoodCondition || null,
        under_medical_treatment: editUnderMedicalTreatment || null,
        under_medical_treatment_desc: editUnderMedicalTreatmentDesc || null,
        serious_illness_operation: editSeriousIllnessOperation || null,
        serious_illness_operation_desc: editSeriousIllnessOperationDesc || null,
        hospitalized: editHospitalized || null,
        hospitalized_desc: editHospitalizedDesc || null,
        prescription_medication: editPrescriptionMedication || null,
        prescription_medication_desc: editPrescriptionMedicationDesc || null,
        drug_use: editDrugUse || null,
      },
    })
    setIsSavingMedHistory(false)
    if (res.success) {
      await handleRefreshRecord()
      setIsEditingMedHistory(false)
    } else {
      alert(res.error || 'Failed to save')
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
      patient_id: localRecord!.patient.id,
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

  const lastVisitDate = (() => {
    if (!localRecord?.appointments || localRecord.appointments.length === 0) return 'No visits recorded'
    const completedAppts = localRecord.appointments
      .filter(appt => appt.status === 'completed')
      .map(appt => new Date(appt.scheduled_at))
      .sort((a, b) => b.getTime() - a.getTime())
    if (completedAppts.length === 0) return 'No visits recorded'
    return formatDate(completedAppts[0])
  })()

  return {
    localRecord,
    isRefreshing,
    lastVisitDate,
    showAssessmentForm,
    setShowAssessmentForm,
    chiefComplaint,
    setChiefComplaint,
    diagnosis,
    setDiagnosis,
    treatmentPlan,
    setTreatmentPlan,
    assessmentNotes,
    setAssessmentNotes,
    isSubmittingAssessment,
    medHistory: {
      editBloodType,
      setEditBloodType,
      editBloodPressure,
      setEditBloodPressure,
      editMedicalFlags,
      setEditMedicalFlags,
      editAllergies,
      setEditAllergies,
      editCurrentMeds,
      setEditCurrentMeds,
      editMedConditions,
      setEditMedConditions,
      editIsPregnant,
      setEditIsPregnant,
      editIsSmoker,
      setEditIsSmoker,
      editPhysicianName,
      setEditPhysicianName,
      editPhysicianOfficeAddress,
      setEditPhysicianOfficeAddress,
      editPhysicianOfficePhone,
      setEditPhysicianOfficePhone,
      editLastDentalVisit,
      setEditLastDentalVisit,
      editBleedingTime,
      setEditBleedingTime,
      editIsNursing,
      setEditIsNursing,
      editIsBirthControl,
      setEditIsBirthControl,
      editAllergyLocalAnesthetic,
      setEditAllergyLocalAnesthetic,
      editAllergyPenicillin,
      setEditAllergyPenicillin,
      editAllergySulfa,
      setEditAllergySulfa,
      editAllergyAspirin,
      setEditAllergyAspirin,
      editAllergyLatex,
      setEditAllergyLatex,
      editAllergyOther,
      setEditAllergyOther,
      editGoodCondition,
      setEditGoodCondition,
      editUnderMedicalTreatment,
      setEditUnderMedicalTreatment,
      editUnderMedicalTreatmentDesc,
      setEditUnderMedicalTreatmentDesc,
      editSeriousIllnessOperation,
      setEditSeriousIllnessOperation,
      editSeriousIllnessOperationDesc,
      setEditSeriousIllnessOperationDesc,
      editHospitalized,
      setEditHospitalized,
      editHospitalizedDesc,
      setEditHospitalizedDesc,
      editPrescriptionMedication,
      setEditPrescriptionMedication,
      editPrescriptionMedicationDesc,
      setEditPrescriptionMedicationDesc,
      editDrugUse,
      setEditDrugUse,
      isSavingMedHistory,
      isEditing: isEditingMedHistory,
      onEdit: () => setIsEditingMedHistory(true),
      onCancel: handleCancelMedicalHistory,
      onSave: handleSaveMedicalHistory,
    },
    handleRefreshRecord,
    handleAddAssessmentSubmit,
  }
}
