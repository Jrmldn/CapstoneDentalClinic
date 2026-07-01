'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ensureRole } from '@/lib/auth/ensureRole'
import { validatePatientAccess } from '@/lib/auth/validatePatientAccess'
import { resolveUpdaterInfo } from './patientCoreActions'

export type PatientDocumentSection = 'medical_records' | 'xrays' | 'consent_forms' | 'treatment_photos' | 'other'
export type PatientDocumentFileType = 'image' | 'pdf'

export interface PatientDocument {
  id: number
  patientId: number
  section: PatientDocumentSection
  fileName: string
  fileType: PatientDocumentFileType
  mimeType: string
  sizeBytes: number
  uploadedByName: string
  uploadedByBranch: string
  createdAt: string
  url: string
}

export interface RecordDocumentUploadInput {
  patientId: number
  clinicId?: number
  section: PatientDocumentSection
  fileName: string
  filePath: string
  fileType: PatientDocumentFileType
  mimeType: string
  sizeBytes: number
}

export async function listPatientDocuments(patientId: number, section: PatientDocumentSection) {
  const access = await validatePatientAccess(patientId)
  if (!access.allowed) return { success: false, error: access.reason, documents: [] as PatientDocument[] }

  try {
    const { data, error } = await supabaseAdmin
      .from('patient_documents')
      .select('*')
      .eq('patient_id', patientId)
      .eq('section', section)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return { success: true, documents: [] as PatientDocument[] }

    const filePaths = data.map(doc => doc.file_path)
    const { data: signedUrls, error: urlError } = await supabaseAdmin.storage
      .from('medical_photos')
      .createSignedUrls(filePaths, 3600)

    if (urlError) throw new Error(urlError.message)

    const documents: PatientDocument[] = data.map(doc => ({
      id: doc.id,
      patientId: doc.patient_id,
      section: doc.section as PatientDocumentSection,
      fileName: doc.file_name,
      fileType: doc.file_type as PatientDocumentFileType,
      mimeType: doc.mime_type,
      sizeBytes: doc.size_bytes,
      uploadedByName: doc.uploaded_by_name,
      uploadedByBranch: doc.uploaded_by_branch,
      createdAt: doc.created_at,
      url: signedUrls?.find(u => u.path === doc.file_path)?.signedUrl || '',
    }))

    return { success: true, documents: documents.filter(d => d.url !== '') }
  } catch (error) {
    console.error('Error in listPatientDocuments:', error)
    return { success: false, error: sanitizeServerError(error), documents: [] as PatientDocument[] }
  }
}

export async function recordPatientDocumentUpload(input: RecordDocumentUploadInput) {
  const access = await validatePatientAccess(input.patientId)
  if (!access.allowed) return { success: false, error: access.reason }
  if (access.role !== 'dentist' && access.role !== 'staff' && access.role !== 'superadmin') {
    return { success: false, error: 'Insufficient permissions' }
  }

  try {
    const { updatedBy, branchName } = await resolveUpdaterInfo()

    const { data, error } = await supabaseAdmin
      .from('patient_documents')
      .insert({
        patient_id: input.patientId,
        clinic_id: input.clinicId ?? null,
        uploaded_by: access.callerId,
        uploaded_by_name: updatedBy,
        uploaded_by_branch: branchName,
        section: input.section,
        file_name: input.fileName,
        file_path: input.filePath,
        file_type: input.fileType,
        mime_type: input.mimeType,
        size_bytes: input.sizeBytes,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return { success: true, document: data }
  } catch (error) {
    console.error('Error in recordPatientDocumentUpload:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}

export async function deletePatientDocument(documentId: number) {
  const auth = await ensureRole('superadmin')
  if (!auth.success) return { success: false, error: auth.error }

  try {
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from('patient_documents')
      .select('file_path')
      .eq('id', documentId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    const { error: storageError } = await supabaseAdmin.storage
      .from('medical_photos')
      .remove([doc.file_path])

    if (storageError) throw new Error(storageError.message)

    const { error: deleteError } = await supabaseAdmin
      .from('patient_documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) throw new Error(deleteError.message)

    return { success: true }
  } catch (error) {
    console.error('Error in deletePatientDocument:', error)
    return { success: false, error: sanitizeServerError(error) }
  }
}
