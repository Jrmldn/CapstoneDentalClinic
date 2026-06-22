'use client'

import { useState, useEffect } from 'react'
import { fetchPatientRecord, updatePatientMedicalHistory } from '@/actions/patientMedicalActions'
import { addClinicalAssessment } from '@/actions/clinicalRecordActions'
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
  isSavingMedHistory: boolean
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
    })
    setIsSavingMedHistory(false)
    if (res.success) {
      await handleRefreshRecord()
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
    return completedAppts[0].toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
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
      isSavingMedHistory,
      onSave: handleSaveMedicalHistory,
    },
    handleRefreshRecord,
    handleAddAssessmentSubmit,
  }
}
