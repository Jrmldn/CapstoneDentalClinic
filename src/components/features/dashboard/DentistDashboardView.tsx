'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ClipboardList,
  RefreshCw,
  ArrowRight,
  User,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  ShieldAlert
} from 'lucide-react'
import PatientRecordModal from '../patients/PatientRecordModal'
import DentistCompleteBillingModal from '../appointments/DentistCompleteBillingModal'
import type { PatientRecord } from '../patients/types'
import type { Service } from '../billing/types'
import StatCard from './components/StatCard'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import { formatDate, formatTime, formatDateLong } from '@/lib/date'
import { fetchPatientRecord } from '@/actions/patientMedicalActions'

export interface Appointment {
  id: number
  scheduled_at: string
  status: string
  payment_status: string
  is_walk_in: boolean
  downpayment: number
  patients: {
    id: number
    first_name: string
    last_name: string
    phone?: string
    birthdate?: string
    gender?: string
  } | null
  services: {
    id: number
    name: string
    price: number
  } | null
}

interface DentistDashboardViewProps {
  dentistId: number
  dentistUserId: string
  dentistName: string
  specialty: string
  clinicId: number
  todayAppts: Appointment[]
  upcomingAppts: Appointment[]
  stats: {
    total: number
    completed: number
    pending: number
    patientsCount: number
  }
  services: Service[]
}


function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    completed: 'bg-slate-50 text-slate-600 border border-slate-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    rescheduled: 'bg-purple-50 text-purple-700 border border-purple-200',
    cancelled: 'bg-red-50 text-red-650 border border-red-200',
    no_show: 'bg-gray-100 text-gray-500 border border-gray-200',
    in_progress: 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold',
    follow_up: 'bg-teal-50 text-teal-700 border border-teal-200',
    pending_patient_confirm: 'bg-purple-50 text-purple-700 border border-purple-200',
  }
  return (
    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${styles[status] ?? 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
      {status === 'in_progress' ? 'In Progress' : status.replace(/_/g, ' ')}
    </span>
  )
}

export default function DentistDashboardView({
  dentistId,
  dentistUserId,
  dentistName,
  specialty,
  clinicId,
  todayAppts,
  upcomingAppts,
  stats,
  services
}: DentistDashboardViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<PatientRecord | null>(null)
  const [isLoadingRecord, setIsLoadingRecord] = useState(false)
  const [updatingApptId, setUpdatingApptId] = useState<number | null>(null)
  const [expandedApptId, setExpandedApptId] = useState<number | null>(null)
  const [completingAppt, setCompletingAppt] = useState<Appointment | null>(null)
  const [patientNotesMap, setPatientNotesMap] = useState<Record<number, { lastVisit: string; bloodPressure: string; medicalFlags: string }>>({})

  useEffect(() => {
    let active = true
    const loadAllFlagsAndHistory = async () => {
      const patientIds = Array.from(new Set(
        [...(todayAppts || []), ...(upcomingAppts || [])]
          .map(appt => appt.patients?.id)
          .filter((id): id is number => typeof id === 'number')
      ))

      for (const pId of patientIds) {
        try {
          const res = await fetchPatientRecord(pId)
          if (active && res.success && res.record) {
            const medHistory = res.record.medicalHistory
            const appts = (res.record.appointments || []) as Array<{ status: string; scheduled_at: string }>
            
            const completedAppts = appts
              .filter(a => a.status === 'completed')
              .map(a => new Date(a.scheduled_at))
              .sort((a, b) => b.getTime() - a.getTime())
            const lastVisitDateStr = completedAppts.length > 0
              ? formatDate(completedAppts[0])
              : 'No past visits'

            const bp = medHistory?.blood_pressure || '120/80 mmHg'
            const flags = medHistory?.medical_flags || 'None'

            setPatientNotesMap(prev => ({
              ...prev,
              [pId]: {
                lastVisit: lastVisitDateStr,
                bloodPressure: bp,
                medicalFlags: flags
              }
            }))
          }
        } catch (err) {
          console.error('Error fetching patient record for dashboard view:', err)
        }
      }
    }
    
    loadAllFlagsAndHistory()
    return () => {
      active = false
    }
  }, [todayAppts, upcomingAppts])

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  // Status Action Handler
  const handleStatusUpdate = async (apptId: number, status: 'confirmed' | 'completed' | 'no_show' | 'cancelled') => {
    setUpdatingApptId(apptId)
    const res = await updateAppointmentStatus(
      apptId,
      status,
      dentistUserId,
      'dentist'
    )
    setUpdatingApptId(null)
    if (res.success) {
      startTransition(() => {
        router.refresh()
      })
    } else {
      alert(res.error || 'Failed to update status')
    }
  }

  // EHR Viewer Trigger
  const handleViewPatientRecord = async (patientId: number) => {
    setIsLoadingRecord(true)
    const res = await fetchPatientRecord(patientId, clinicId)
    setIsLoadingRecord(false)
    if (res.success && res.record) {
      setSelectedPatientRecord(res.record as PatientRecord)
    } else {
      alert(res.error || 'Failed to load patient record')
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, Dr. {dentistName} !
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Specialty: {specialty || 'General Dentist'} · {formatDateLong(new Date())}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Today's Appointments"
          value={stats.total}
          sub={`${stats.completed} completed · ${stats.pending} pending`}
          icon={ClipboardList}
          color="blue"
          href="/dentist-dashboard/calendar"
        />
        <StatCard
          label="Pending Patients"
          value={stats.pending}
          sub="Awaiting treatment today"
          icon={Clock}
          color="amber"
          href="/dentist-dashboard"
        />
        <StatCard
          label="Completed Today"
          value={stats.completed}
          sub="Finished consultations"
          icon={CheckCircle2}
          color="emerald"
          href="/dentist-dashboard"
        />
        <StatCard
          label="Total Patients"
          value={stats.patientsCount}
          sub="Unique cases at this clinic"
          icon={Users}
          color="blue"
          href="/dentist-dashboard/patients"
        />
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-800">Today's Schedule</h2>
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
              {isPending && <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />}
              Local Queue
            </span>
          </div>          <div className="divide-y divide-gray-100">
            {todayAppts.length === 0 ? (
              <div className="px-6 py-12 text-center bg-slate-50/20">
                <CheckCircle2 className="w-9 h-9 text-gray-300 mx-auto mb-2.5" />
                <p className="text-xs font-semibold text-gray-400">No appointments scheduled today</p>
              </div>
            ) : (
              todayAppts.map((appt) => {
                const patient = appt.patients
                const service = appt.services
                const isExpanded = expandedApptId === appt.id
                const isBusy = updatingApptId === appt.id || isPending

                const apptTime = formatTime(appt.scheduled_at)

                // Mock duration based on service or typical appointment (e.g. 45 min, 90 min)
                let durationStr = '45 min'
                if (service?.name.toLowerCase().includes('root canal')) durationStr = '90 min'
                else if (service?.name.toLowerCase().includes('crown')) durationStr = '60 min'
                else if (service?.name.toLowerCase().includes('orthodontic')) durationStr = '30 min'
                else if (service?.name.toLowerCase().includes('periodontal')) durationStr = '75 min'

                const notes = patient ? patientNotesMap[patient.id] : null
                const medicalFlag = notes?.medicalFlags && notes.medicalFlags !== 'None' ? notes.medicalFlags : null
                const lastVisit = notes?.lastVisit ?? 'Loading...'
                const bloodPressure = notes?.bloodPressure ?? '120/80 mmHg'

                // Determine display status - "Completed" (completed), "In Progress" (confirmed/in progress), "Upcoming" (pending)
                let displayStatus = appt.status
                if (appt.status === 'confirmed') displayStatus = 'in_progress'
                else if (appt.status === 'pending') displayStatus = 'confirmed' // render upcoming as blue badge/confirmed in mockup

                return (
                  <div key={appt.id} className="hover:bg-slate-50/30 transition-all duration-150">
                    <div className="px-6 py-4 flex items-center justify-between">
                      {/* Left: Time and Duration */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-center w-14 flex-shrink-0">
                          <span className="text-sm font-black text-slate-800 block">{apptTime}</span>
                          <span className="text-[10px] text-gray-400 font-bold block">{durationStr}</span>
                        </div>

                        {/* Middle: Name, Flags, and Service */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-800 truncate">
                              {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}
                            </span>
                            {medicalFlag && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-red-50 text-red-650 border border-red-150 animate-pulse">
                                <ShieldAlert className="w-2.5 h-2.5 text-red-500" />
                                {medicalFlag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{service?.name ?? 'General Consult'}</p>
                        </div>
                      </div>

                      {/* Right: Status, Record button, Chevron */}
                      <div className="flex items-center gap-3.5 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={displayStatus} />
                          {patient && (
                            <button
                              onClick={() => handleViewPatientRecord(patient.id)}
                              disabled={isBusy}
                              className="px-3 py-1.5 bg-white border border-gray-250 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              Record
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => setExpandedApptId(isExpanded ? null : appt.id)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-450 hover:text-slate-700 transition"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Pre-treatment Notes Section */}
                    {isExpanded && (
                      <div className="px-6 pb-5 pt-1 border-t border-gray-100 bg-slate-50/30 animate-in fade-in duration-200">
                        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-3xs space-y-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pre-treatment Notes</span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 block font-semibold">LAST VISIT</span>
                              <span className="text-slate-800">{lastVisit}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 block font-semibold">BLOOD PRESSURE</span>
                              <span className="text-slate-800">{bloodPressure}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 block font-semibold">MEDICAL FLAGS</span>
                              <span className={medicalFlag ? 'text-red-650' : 'text-slate-850'}>
                                {medicalFlag || 'None'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status updates action buttons inside expanded panel */}
                        {(appt.status === 'pending' || appt.status === 'confirmed' || appt.status === 'rescheduled') && (
                          <div className="flex justify-end gap-2.5 pt-3">
                            {(appt.status === 'pending' || appt.status === 'rescheduled') && (
                              <button
                                onClick={() => handleStatusUpdate(appt.id, 'confirmed')}
                                disabled={isBusy}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}
                            {appt.status === 'confirmed' ? (
                              <button
                                onClick={() => setCompletingAppt(appt)}
                                disabled={isBusy}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition disabled:opacity-50"
                              >
                                Complete &amp; Send to Billing
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusUpdate(appt.id, 'completed')}
                                disabled={isBusy}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition disabled:opacity-50"
                              >
                                Complete Appointment
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusUpdate(appt.id, 'no_show')}
                              disabled={isBusy}
                              className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition disabled:opacity-50"
                            >
                              No Show
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel this appointment?')) {
                                  handleStatusUpdate(appt.id, 'cancelled')
                                }
                              }}
                              disabled={isBusy}
                              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-2xs transition disabled:opacity-50"
                            >
                              Cancel Appointment
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Side panel: Upcoming queue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-800">Upcoming Queue</h2>
            <Link
              href="/dentist-dashboard/calendar"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition"
            >
              Calendar <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {upcomingAppts.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No upcoming appointments</p>
              </div>
            ) : (
              upcomingAppts.map((appt) => {
                const patient = appt.patients
                const service = appt.services
                const dateStr = formatDate(appt.scheduled_at)
                const timeStr = formatTime(appt.scheduled_at)

                return (
                  <div key={appt.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{service?.name ?? '—'}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-blue-600 font-bold block">{dateStr}</span>
                      <span className="text-[10px] text-gray-400 block">{timeStr}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      {isLoadingRecord && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white p-5 rounded-xl shadow-lg flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-700">Loading Clinical Records...</span>
          </div>
        </div>
      )}

      {/* Complete & Send to Billing Modal */}
      <DentistCompleteBillingModal
        appointment={completingAppt}
        onClose={() => setCompletingAppt(null)}
        clinicId={clinicId}
        dentistUserId={dentistUserId}
        dentistId={dentistId}
        services={services}
        onSuccess={() => {
          setCompletingAppt(null)
          startTransition(() => router.refresh())
        }}
      />

      {/* Patient EHR Modal */}
      <PatientRecordModal
        record={selectedPatientRecord}
        onClose={() => setSelectedPatientRecord(null)}
        dentistId={dentistId}
        clinicId={clinicId}
      />
    </div>
  )
}
