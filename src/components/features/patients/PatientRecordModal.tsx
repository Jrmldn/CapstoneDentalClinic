'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  User,
  Activity,
  History,
  ClipboardList,
  HeartPulse,
  X,
  RefreshCw,
  Calendar,
  Camera
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
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !localRecord) return null

  const tabs: Array<{ id: RecordTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'chart', label: 'Dental Chart', icon: Activity },
    { id: 'treatments', label: 'Treatment', icon: History },
    { id: 'prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { id: 'info', label: 'Medical History', icon: User },
    { id: 'periodontal', label: 'Periodontal', icon: HeartPulse },
    { id: 'followups', label: 'Follow-ups', icon: Calendar },
    { id: 'photos', label: 'Photos', icon: Camera }
  ]

  return createPortal(
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
            <MedicalHistoryTab
              localRecord={localRecord}
              viewerRole={viewerRole}
              lastVisitDate={lastVisitDate}
              medHistory={medHistory}
              readOnly={true}
              showSaveButton={false}
            />
          )}
          {activeRecordTab === 'chart' && (
            <DentalChartTab
              patientId={localRecord.patient.id}
              clinicId={clinicId ?? 0}
              dentalCharts={localRecord.dentalCharts}
              onRefresh={handleRefreshRecord}
              readOnly={true}
              historyOnly={true}
            />
          )}
          {activeRecordTab === 'treatments' && (
            <TreatmentTab
              patientId={localRecord.patient.id}
              clinicId={clinicId ?? 0}
              dentistId={dentistId}
              treatments={localRecord.treatmentHistory || []}
              onRefresh={handleRefreshRecord}
              readOnly={true}
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
              readOnly={true}
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
          {activeRecordTab === 'followups' && (
            <FollowupsTab
              patientId={localRecord.patient.id}
              clinicId={clinicId ?? 0}
              dentistId={dentistId}
              appointments={localRecord.appointments || []}
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

        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-xs"
          >
            Close EHR Viewer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
