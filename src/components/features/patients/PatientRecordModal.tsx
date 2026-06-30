'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  User,
  Activity,
  History,
  HeartPulse,
  X,
  RefreshCw,
  Camera,
  ScanLine
} from 'lucide-react'
import { usePatientRecord } from './usePatientRecord'
import MedicalHistoryTab from './MedicalHistoryTab'
import DentalChartTab from './DentalChartTab'
import TreatmentTab from './TreatmentTab'
import PrescriptionsTab from './PrescriptionsTab'
import PeriodontalTab from './PeriodontalTab'
import FollowupsTab from './FollowupsTab'
import PhotosTab from './PhotosTab'
import type { RecordTab, PatientRecord } from './types'

interface PatientRecordModalProps {
  record: PatientRecord | null
  onClose: () => void
  dentistId?: number
  clinicId?: number
  viewerRole?: 'dentist' | 'staff'
}

export default function PatientRecordModal({ record, onClose, dentistId, clinicId, viewerRole = 'dentist' }: PatientRecordModalProps) {
  const {
    localRecord,
    isRefreshing,
    lastVisitDate,
    medHistory,
    handleRefreshRecord,
  } = usePatientRecord(record, clinicId, dentistId)

  const [activeRecordTab, setActiveRecordTab] = useState<RecordTab>('chart')
  const [mounted, setMounted] = useState(false)
  const [snapshotMode, setSnapshotMode] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !localRecord) return null

  // Prescriptions and Follow-ups are merged into the Treatment tab
  const tabs: Array<{ id: RecordTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'chart',    label: 'Dental Chart',      icon: Activity   },
    { id: 'treatments', label: 'Treatment', icon: History    },
    { id: 'info',     label: 'Medical',    icon: User       },
    { id: 'periodontal', label: 'Periodontal',   icon: HeartPulse },
    { id: 'photos',   label: 'Photos',     icon: Camera     },
  ]

  const handleChartRefresh = async () => {
    await handleRefreshRecord()
    setSnapshotMode(false)
  }

  const handleEnterSnapshot = () => {
    setSnapshotMode(true)
    setActiveRecordTab('chart')
  }

  const handleCancelSnapshot = () => {
    setSnapshotMode(false)
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
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

        {/* Tab bar — icon above label */}
        <div className="flex border-b border-gray-100 bg-white px-4">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveRecordTab(tab.id)
                  if (tab.id !== 'chart') setSnapshotMode(false)
                }}
                className={`flex flex-col items-center gap-1 flex-1 py-3 text-[11px] font-bold transition-all border-b-2 outline-none ${
                  activeRecordTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeRecordTab === 'chart' && (
            <DentalChartTab
              patientId={localRecord.patient.id}
              clinicId={clinicId ?? 0}
              dentistId={dentistId}
              dentalCharts={localRecord.dentalCharts}
              onRefresh={handleChartRefresh}
              readOnly={!snapshotMode}
              historyOnly={!snapshotMode}
            />
          )}
          {activeRecordTab === 'treatments' && (
            <div className="space-y-8">
              <TreatmentTab
                patientId={localRecord.patient.id}
                clinicId={clinicId ?? 0}
                dentistId={dentistId}
                treatments={localRecord.treatmentHistory || []}
                onRefresh={handleRefreshRecord}
                readOnly={true}
              />
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescriptions</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
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
                  readOnly={true}
                />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Follow-ups</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                <FollowupsTab
                  patientId={localRecord.patient.id}
                  clinicId={clinicId ?? 0}
                  dentistId={dentistId}
                  appointments={localRecord.appointments || []}
                  onRefresh={handleRefreshRecord}
                  readOnly={true}
                />
              </div>
            </div>
          )}
          {activeRecordTab === 'info' && (
            <MedicalHistoryTab
              localRecord={localRecord}
              viewerRole={viewerRole}
              lastVisitDate={lastVisitDate}
              medHistory={medHistory}
              readOnly={true}
              showSaveButton={false}
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
              readOnly={true}
            />
          )}
          {activeRecordTab === 'photos' && (
            <PhotosTab
              patientId={localRecord.patient.id}
              viewerRole={viewerRole}
              readOnly={true}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-between items-center">
          <div>
            {snapshotMode && (
              <button
                onClick={handleCancelSnapshot}
                className="px-4 py-2 border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-100 transition font-semibold text-xs"
              >
                Cancel Snapshot
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {viewerRole === 'dentist' && dentistId && !snapshotMode && (
              <button
                onClick={handleEnterSnapshot}
                className="flex items-center gap-1.5 px-4 py-2 border border-blue-300 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition font-semibold text-xs"
              >
                <ScanLine className="w-3.5 h-3.5" />
                Save Chart Snapshot
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-xs"
            >
              Close EHR Viewer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
