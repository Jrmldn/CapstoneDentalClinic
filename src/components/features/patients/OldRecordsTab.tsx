'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertCircle,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  Trash,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/date'
import {
  listPatientDocuments,
  recordPatientDocumentUpload,
  deletePatientDocument,
  type PatientDocument,
  type PatientDocumentSection,
  type PatientDocumentFileType,
} from '@/actions/patientDocumentActions'
import DocumentViewerModal from './DocumentViewerModal'
import WebcamCaptureModal from './WebcamCaptureModal'
import imageCompression from 'browser-image-compression'

interface OldRecordsTabProps {
  patientId: number | string
  clinicId?: number
  viewerRole: string
}

const SECTIONS: { id: PatientDocumentSection; label: string }[] = [
  { id: 'medical_records', label: 'Medical Records' },
  { id: 'xrays', label: 'X-Rays' },
  { id: 'consent_forms', label: 'Consent Forms' },
  { id: 'treatment_photos', label: 'Treatment Photos' },
  { id: 'other', label: 'Other' },
]

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function OldRecordsTab({ patientId, clinicId, viewerRole }: OldRecordsTabProps) {
  const patientIdNum = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId
  const [documentsBySection, setDocumentsBySection] = useState<Partial<Record<PatientDocumentSection, PatientDocument[]>>>({})
  const [loadingSection, setLoadingSection] = useState<PatientDocumentSection | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<PatientDocumentSection | null>('medical_records')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadModalSection, setUploadModalSection] = useState<PatientDocumentSection | ''>('')
  const [uploadingSection, setUploadingSection] = useState<PatientDocumentSection | null>(null)
  const [viewerDoc, setViewerDoc] = useState<PatientDocument | null>(null)
  const [webcamOpen, setWebcamOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const chooseFileInputRef = useRef<HTMLInputElement>(null)
  const pendingSectionRef = useRef<PatientDocumentSection | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const canUpload = viewerRole === 'dentist' || viewerRole === 'staff' || viewerRole === 'superadmin'
  const canDelete = viewerRole === 'superadmin'

  const loadSection = useCallback(async (section: PatientDocumentSection) => {
    setLoadingSection(section)
    setError(null)
    const res = await listPatientDocuments(patientIdNum, section)
    setLoadingSection(prev => (prev === section ? null : prev))
    if (res.success) {
      setDocumentsBySection(prev => ({ ...prev, [section]: res.documents }))
    } else {
      setError(res.error || 'Failed to load records.')
    }
  }, [patientIdNum])

  useEffect(() => {
    if (expandedSection && documentsBySection[expandedSection] === undefined) {
      loadSection(expandedSection)
    }
  }, [expandedSection, documentsBySection, loadSection])

  const toggleSection = (id: PatientDocumentSection) => {
    setExpandedSection(prev => (prev === id ? null : id))
  }

  const openUploadPicker = (section: PatientDocumentSection, mode: 'choose' | 'camera') => {
    pendingSectionRef.current = section
    if (mode === 'choose') {
      chooseFileInputRef.current?.click()
    } else {
      setWebcamOpen(true)
    }
  }

  const uploadFile = async (
    section: PatientDocumentSection,
    file: File | Blob,
    fileName: string,
    mimeType: string,
  ) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File size exceeds 5MB. Please upload a smaller file.')
      return
    }

    const isImage = mimeType.startsWith('image/')
    const isPdf = mimeType === 'application/pdf'
    if (!isImage && !isPdf) {
      setError('Please select an image (JPG, PNG, WEBP) or PDF file.')
      return
    }

    const fileType: PatientDocumentFileType = isImage ? 'image' : 'pdf'
    setUploadingSection(section)

    try {
      let fileToUpload: File | Blob = file
      if (isImage) {
        fileToUpload = await imageCompression(file as File, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        })
      }

      const fileExt = fileName.split('.').pop() || (isImage ? 'jpg' : 'pdf')
      const uniqueId = Math.random().toString(36).substring(2, 9)
      const timestamp = Date.now()
      const cleanOriginalName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-')
      const storedFileName = `${timestamp}_${uniqueId}_${cleanOriginalName}.${fileExt}`
      const filePath = `${patientIdNum}/${section}/${storedFileName}`

      const { error: uploadError } = await supabase.storage
        .from('medical_photos')
        .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const res = await recordPatientDocumentUpload({
        patientId: patientIdNum,
        clinicId,
        section,
        fileName,
        filePath,
        fileType,
        mimeType,
        sizeBytes: fileToUpload.size,
      })

      if (!res.success) throw new Error(res.error || 'Failed to save file record.')

      setSuccess('File uploaded successfully.')
      setUploadModalOpen(false)
      setUploadModalSection('')
      await loadSection(section)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload file.')
    } finally {
      setUploadingSection(null)
    }
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const section = pendingSectionRef.current
    e.target.value = ''
    if (!file || !section) return

    setError(null)
    setSuccess(null)
    await uploadFile(section, file, file.name, file.type)
  }

  const handleWebcamCapture = async (blob: Blob) => {
    const section = pendingSectionRef.current
    setWebcamOpen(false)
    if (!section) return

    setError(null)
    setSuccess(null)
    await uploadFile(section, blob, `webcam-capture-${Date.now()}.jpg`, 'image/jpeg')
  }

  const handleDelete = async (doc: PatientDocument) => {
    if (!confirm(`Are you sure you want to permanently delete "${doc.fileName}"?`)) return
    setError(null)
    setSuccess(null)
    const res = await deletePatientDocument(doc.id)
    if (res.success) {
      setSuccess('File deleted successfully.')
      if (viewerDoc?.id === doc.id) setViewerDoc(null)
      await loadSection(doc.section)
    } else {
      setError(res.error || 'Failed to delete file.')
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={chooseFileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelected}
        className="hidden"
      />

      {error && (
        <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-green-50 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {canUpload && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setUploadModalSection('')
              setUploadModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload
          </button>
        </div>
      )}

      {SECTIONS.map(section => {
          const isExpanded = expandedSection === section.id
          const sectionDocs = documentsBySection[section.id]
          const isUploadingHere = uploadingSection === section.id
          const isLoadingThis = loadingSection === section.id

          return (
            <div key={section.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50/50 transition"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                  <h4 className="font-bold text-slate-800 text-sm">{section.label}</h4>
                  {sectionDocs !== undefined && (
                    <span className="text-[10px] text-slate-400 font-semibold">({sectionDocs.length})</span>
                  )}
                </div>

                {isUploadingHere && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 animate-in fade-in duration-200">
                  {isLoadingThis || sectionDocs === undefined ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                      <p className="text-xs font-medium">Loading {section.label.toLowerCase()}...</p>
                    </div>
                  ) : sectionDocs.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium text-center py-6">
                      No {section.label.toLowerCase()} uploaded yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {sectionDocs.map(doc => (
                        <div
                          key={doc.id}
                          className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all"
                        >
                          <div className="aspect-square relative bg-slate-100 flex items-center justify-center overflow-hidden">
                            {doc.fileType === 'image' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={doc.url}
                                alt={doc.fileName}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <FileText className="w-10 h-10 text-blue-400" />
                            )}
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => setViewerDoc(doc)}
                                className="p-2 bg-white text-slate-800 rounded-full hover:bg-slate-100 transition shadow-sm"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <a
                                href={doc.url}
                                download={doc.fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white text-slate-800 rounded-full hover:bg-slate-100 transition shadow-sm"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(doc)}
                                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-sm"
                                  title="Delete"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="p-2.5">
                            <p className="text-[10px] font-semibold text-slate-700 truncate" title={doc.fileName}>
                              {doc.fileName}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                              {formatDateTime(doc.createdAt)} · {formatBytes(doc.sizeBytes)}
                            </p>
                            <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[8px] text-slate-500 font-medium space-y-0.5">
                              <p><span className="font-semibold text-slate-600">Uploaded by:</span> {doc.uploadedByName}</p>
                              <p><span className="font-semibold text-slate-600">Branch:</span> {doc.uploadedByBranch}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

      {viewerDoc && <DocumentViewerModal doc={viewerDoc} onClose={() => setViewerDoc(null)} />}

      {webcamOpen && (
        <WebcamCaptureModal onCapture={handleWebcamCapture} onClose={() => setWebcamOpen(false)} />
      )}

      {uploadModalOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs px-4"
          onClick={() => setUploadModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Upload File</h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
            <select
              value={uploadModalSection}
              onChange={e => setUploadModalSection(e.target.value as PatientDocumentSection)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 mb-4 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select a category</option>
              {SECTIONS.map(section => (
                <option key={section.id} value={section.id}>{section.label}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => uploadModalSection && openUploadPicker(uploadModalSection, 'choose')}
                disabled={!uploadModalSection}
                className="flex flex-col items-center justify-center gap-1.5 py-4 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
              >
                <FolderOpen className="w-5 h-5" />
                Choose File
              </button>
              <button
                onClick={() => uploadModalSection && openUploadPicker(uploadModalSection, 'camera')}
                disabled={!uploadModalSection}
                className="flex flex-col items-center justify-center gap-1.5 py-4 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
