'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  User,
  Phone,
  Calendar,
  FileText,
  Activity,
  ClipboardList,
  AlertTriangle,
  History,
  X,
  RefreshCw,
  HeartPulse
} from 'lucide-react'
import { registerPatient, fetchPatientRecord } from '@/actions/patientActions'

interface PatientSummary {
  id: number
  first_name: string
  last_name: string
  phone: string
  email: string | null
  birthdate: string
  gender: string
  is_guest: boolean
  created_at: string
}

interface PatientsClientProps {
  clinicId: number
  initialPatients: PatientSummary[]
}

export default function PatientsClient({ clinicId, initialPatients }: PatientsClientProps) {
  const [patients, setPatients] = useState<PatientSummary[]>(initialPatients)
  const [searchTerm, setSearchTerm] = useState('')
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<any | null>(null)
  const [isLoadingRecord, setIsLoadingRecord] = useState(false)

  // Registration Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthdate: '',
    gender: 'male',
    address: '',
    bloodType: '',
    allergies: '',
    medications: '',
    conditions: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // View Record Handler
  const handleViewRecord = async (patientId: number) => {
    setIsLoadingRecord(true)
    const res = await fetchPatientRecord(patientId)
    setIsLoadingRecord(false)
    if (res.success && res.record) {
      setSelectedPatientRecord(res.record)
    } else {
      alert(res.error || 'Failed to load patient record')
    }
  }

  // Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    const allergiesArr = formData.allergies.split(',').map(s => s.trim()).filter(Boolean)
    const medsArr = formData.medications.split(',').map(s => s.trim()).filter(Boolean)
    const condsArr = formData.conditions.split(',').map(s => s.trim()).filter(Boolean)

    const res = await registerPatient({
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      email: formData.email.trim() || undefined,
      birthdate: formData.birthdate,
      gender: formData.gender,
      address: formData.address,
      blood_type: formData.bloodType || undefined,
      allergies: allergiesArr.length > 0 ? allergiesArr : undefined,
      current_medications: medsArr.length > 0 ? medsArr : undefined,
      medical_conditions: condsArr.length > 0 ? condsArr : undefined,
      is_guest: false,
      clinic_id: clinicId
    })

    setIsSubmitting(false)
    if (res.success && res.patient) {
      alert('Patient registered successfully!')
      setIsRegisterModalOpen(false)
      const newPatient: PatientSummary = {
        id: res.patient.id,
        first_name: res.patient.first_name,
        last_name: res.patient.last_name,
        phone: res.patient.phone,
        email: res.patient.email ?? null,
        birthdate: res.patient.birthdate,
        gender: res.patient.gender,
        is_guest: res.patient.is_guest,
        created_at: res.patient.created_at
      }
      setPatients(prev => [newPatient, ...prev])
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        birthdate: '',
        gender: 'male',
        address: '',
        bloodType: '',
        allergies: '',
        medications: '',
        conditions: ''
      })
    } else {
      setFormError(res.error || 'Failed to register patient')
    }
  }

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      (p.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const [activeRecordTab, setActiveRecordTab] = useState<'info' | 'chart' | 'treatments' | 'assessments' | 'appts'>('info')

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name, phone or email..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Register Patient
        </button>
      </div>

      {/* Patients List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPatients.map((patient) => {
          const birthDate = new Date(patient.birthdate)
          const age = new Date().getFullYear() - birthDate.getFullYear()

          return (
            <div
              key={patient.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                {patient.is_guest ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Guest Walk-In
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Registered Patient
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition">
                  {patient.last_name}, {patient.first_name}
                </h3>
                <div className="space-y-1 mt-2 text-xs text-gray-500">
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {patient.phone}
                  </p>
                  {patient.email && (
                    <p className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      {patient.email}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {patient.birthdate} ({age} yrs old, {patient.gender})
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-50 flex gap-2">
                <button
                  onClick={() => handleViewRecord(patient.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-600 hover:text-white transition"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  View Clinical Record
                </button>
              </div>
            </div>
          )
        })}

        {filteredPatients.length === 0 && (
          <div className="col-span-full py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-500 font-medium">No patients found</h3>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search query or register a new patient.</p>
          </div>
        )}
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

      {/* MODAL: Register Patient */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-900 text-lg">Register Patient</h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Personal Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 border-b border-gray-100 pb-1">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">First Name *</span>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Last Name *</span>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Phone Number *</span>
                    <input
                      type="tel"
                      required
                      placeholder="09XXXXXXXXX"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Email Address</span>
                    <input
                      type="email"
                      placeholder="optional"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Birthdate *</span>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      value={formData.birthdate}
                      onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Gender *</span>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-xs font-semibold text-slate-600">Home Address</span>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 border-b border-gray-100 pb-1">Medical Profile (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Blood Type</span>
                    <input
                      type="text"
                      placeholder="e.g. O+, A-"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      value={formData.bloodType}
                      onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Allergies (comma-separated)</span>
                    <input
                      type="text"
                      placeholder="e.g. Penicillin, Latex"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      value={formData.allergies}
                      onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Current Medications (comma-separated)</span>
                    <input
                      type="text"
                      placeholder="e.g. Aspirin, Metformin"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      value={formData.medications}
                      onChange={e => setFormData({ ...formData, medications: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Medical Conditions (comma-separated)</span>
                    <input
                      type="text"
                      placeholder="e.g. Diabetes, Hypertension"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      value={formData.conditions}
                      onChange={e => setFormData({ ...formData, conditions: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Full Patient Record */}
      {selectedPatientRecord && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {selectedPatientRecord.patient.first_name} {selectedPatientRecord.patient.last_name}
                  </h3>
                  <p className="text-xs text-gray-500">Clinical Chart &amp; Health Record</p>
                </div>
              </div>
              <button onClick={() => setSelectedPatientRecord(null)} className="p-1 hover:bg-gray-200 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-white px-6">
              {[
                { id: 'info', label: 'EHR Summary & Medicals', icon: User },
                { id: 'chart', label: 'Dental Tooth Conditions', icon: Activity },
                { id: 'treatments', label: 'Treatment History', icon: History },
                { id: 'assessments', label: 'Assessments', icon: FileText },
                { id: 'appts', label: 'Appointments', icon: ClipboardList }
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveRecordTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 outline-none ${activeRecordTab === tab.id
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
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs grid grid-cols-3 gap-4">
                    <div className="col-span-3"><h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-2">Personal Details</h4></div>
                    <div><span className="text-[10px] text-gray-400 block font-semibold">GENDER</span><span className="text-sm font-medium capitalize text-slate-800">{selectedPatientRecord.patient.gender}</span></div>
                    <div><span className="text-[10px] text-gray-400 block font-semibold">BIRTHDATE</span><span className="text-sm font-medium text-slate-800">{selectedPatientRecord.patient.birthdate}</span></div>
                    <div><span className="text-[10px] text-gray-400 block font-semibold">PHONE</span><span className="text-sm font-medium text-slate-800">{selectedPatientRecord.patient.phone}</span></div>
                    {selectedPatientRecord.patient.email && (
                      <div><span className="text-[10px] text-gray-400 block font-semibold">EMAIL</span><span className="text-sm font-medium text-slate-800">{selectedPatientRecord.patient.email}</span></div>
                    )}
                    <div className="col-span-3"><span className="text-[10px] text-gray-400 block font-semibold">ADDRESS</span><span className="text-sm font-medium text-slate-800">{selectedPatientRecord.patient.address || '—'}</span></div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs grid grid-cols-2 gap-5">
                    <div className="col-span-2"><h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-2">Medical History Summary</h4></div>
                    {selectedPatientRecord.medicalHistory ? (
                      <>
                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">BLOOD TYPE</span>
                            <span className="text-sm font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-md inline-block mt-0.5">
                              {selectedPatientRecord.medicalHistory.blood_type || 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">ALLERGIES</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedPatientRecord.medicalHistory.allergies?.length > 0 ? (
                                selectedPatientRecord.medicalHistory.allergies.map((a: string) => (
                                  <span key={a} className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-medium">{a}</span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">No allergies listed</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">CURRENT MEDICATIONS</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedPatientRecord.medicalHistory.current_medications?.length > 0 ? (
                                selectedPatientRecord.medicalHistory.current_medications.map((m: string) => (
                                  <span key={m} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-full font-medium">{m}</span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">None listed</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">MEDICAL CONDITIONS</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedPatientRecord.medicalHistory.medical_conditions?.length > 0 ? (
                                selectedPatientRecord.medicalHistory.medical_conditions.map((c: string) => (
                                  <span key={c} className="bg-red-50 text-red-700 border border-red-200 text-xs px-2 py-0.5 rounded-full font-medium">{c}</span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">None listed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2 text-center py-6 text-gray-400 text-sm">No medical history filled out for this patient.</div>
                    )}
                  </div>
                </div>
              )}

              {activeRecordTab === 'chart' && (
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-4">Dental Chart Conditions</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-slate-500 font-bold border-b border-gray-100">
                          <th className="px-4 py-2">Date Recorded</th>
                          <th className="px-4 py-2">Tooth Number</th>
                          <th className="px-4 py-2">Tooth Type</th>
                          <th className="px-4 py-2">Condition</th>
                          <th className="px-4 py-2">Surface</th>
                          <th className="px-4 py-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-slate-700">
                        {selectedPatientRecord.dentalCharts?.flatMap((chart: any) =>
                          chart.tooth_conditions?.map((cond: any) => (
                            <tr key={cond.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 font-semibold text-gray-500">{new Date(cond.recorded_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-bold text-slate-900">Tooth #{cond.tooth_number}</td>
                              <td className="px-4 py-3 capitalize">{cond.tooth_type}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-amber-50 text-amber-700 border border-amber-200">
                                  {cond.condition.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 uppercase font-medium">{cond.surface || '—'}</td>
                              <td className="px-4 py-3 text-gray-500">{cond.notes || '—'}</td>
                            </tr>
                          ))
                        )}
                        {selectedPatientRecord.dentalCharts?.flatMap((c: any) => c.tooth_conditions ?? []).length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-400">No tooth conditions recorded yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeRecordTab === 'treatments' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
                    <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-4">Treatment History</h4>
                    <div className="divide-y divide-gray-100">
                      {selectedPatientRecord.treatmentHistory?.length > 0 ? (
                        selectedPatientRecord.treatmentHistory.map((treat: any) => (
                          <div key={treat.id} className="py-3 flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-850 text-sm">{treat.services?.name}</p>
                              <p className="text-xs text-gray-400">Performed by: Dr. {treat.dentists ? `${treat.dentists.first_name} ${treat.dentists.last_name}` : 'Unknown'}</p>
                            </div>
                            <span className="text-xs text-gray-500 font-semibold">{new Date(treat.performed_at).toLocaleDateString()}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-gray-400 text-xs">No treatments recorded.</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
                    <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-4">Prescriptions</h4>
                    <div className="divide-y divide-gray-100">
                      {selectedPatientRecord.prescriptions?.length > 0 ? (
                        selectedPatientRecord.prescriptions.map((pres: any) => (
                          <div key={pres.id} className="py-3 flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-850 text-sm">{pres.medication_name}</p>
                              <p className="text-xs text-slate-600">Dosage: {pres.dosage} | Frequency: {pres.frequency} | Duration: {pres.duration}</p>
                              <p className="text-[10px] text-gray-450 mt-1">Prescribed by Dr. {pres.dentists ? `${pres.dentists.first_name} ${pres.dentists.last_name}` : 'Unknown'}</p>
                            </div>
                            <span className="text-xs text-gray-500 font-semibold">{new Date(pres.prescribed_at).toLocaleDateString()}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-gray-400 text-xs">No prescriptions recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeRecordTab === 'assessments' && (
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-4">Clinical Assessments</h4>
                  <div className="space-y-4">
                    {selectedPatientRecord.assessments?.length > 0 ? (
                      selectedPatientRecord.assessments.map((ass: any) => (
                        <div key={ass.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
                          <div className="flex justify-between items-center border-b border-gray-200 pb-1.5 mb-1.5">
                            <span className="font-bold text-slate-700">Assessment by Dr. {ass.dentists ? `${ass.dentists.first_name} ${ass.dentists.last_name}` : 'Unknown'}</span>
                            <span className="text-gray-500 font-semibold">{new Date(ass.assessed_at).toLocaleDateString()}</span>
                          </div>
                          <p><strong>Chief Complaint:</strong> {ass.chief_complaint}</p>
                          <p><strong>Diagnosis:</strong> {ass.diagnosis}</p>
                          <p><strong>Treatment Plan:</strong> {ass.treatment_plan}</p>
                          {ass.notes && <p className="text-gray-500 italic"><strong>Notes:</strong> {ass.notes}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-6 text-gray-400 text-xs">No clinical assessments recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {activeRecordTab === 'appts' && (
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-gray-100 pb-1 mb-4">Appointment History</h4>
                  <div className="divide-y divide-gray-100">
                    {selectedPatientRecord.appointments?.length > 0 ? (
                      selectedPatientRecord.appointments.map((appt: any) => (
                        <div key={appt.id} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{appt.services?.name}</p>
                            <p className="text-gray-500">Dr. {appt.dentists ? `${appt.dentists.first_name} ${appt.dentists.last_name}` : 'TBD'} | Status: <span className="capitalize">{appt.status}</span></p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{new Date(appt.scheduled_at).toLocaleDateString()}</p>
                            <p className="text-gray-500">{new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-6 text-gray-400 text-xs">No appointments recorded.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedPatientRecord(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-xs"
              >
                Close EHR Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}