'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, ShieldAlert, CheckCircle2, Heart, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updatePatientProfile, updatePatientMedicalHistory } from '@/actions/patientActions'
import { PatientRecord } from './types'
import { isPlaceholderPhone, formatPhone } from '@/utils/phone-helpers'

interface ProfileTabProps {
  record: PatientRecord
  hmoOptions: string[]
}

export function ProfileTab({ record, hmoOptions }: ProfileTabProps) {
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'
  const [profileStatus, setProfileStatus] = useState<{ success?: boolean; error?: string; loading?: boolean }>({})
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // Profile Form State
  const [profileFirst, setProfileFirst] = useState(record.patient.first_name || '')
  const [profileLast, setProfileLast] = useState(record.patient.last_name || '')
  const [profilePhone, setProfilePhone] = useState(
    isPlaceholderPhone(record.patient.phone) ? '' : record.patient.phone!
  )
  const [profileBirthdate, setProfileBirthdate] = useState(record.patient.birthdate || '')
  const [profileGender, setProfileGender] = useState(record.patient.gender || 'male')
  const [profileAddress, setProfileAddress] = useState(record.patient.address || '')
  const [previousDentist, setPreviousDentist] = useState((record.patient as any).previous_dentist || '')
  const [hmoCards, setHmoCards] = useState<string[]>((record.patient as any).hmo_cards || [])

  const toggleHmo = (name: string) => {
    setHmoCards(prev => prev.includes(name) ? prev.filter(h => h !== name) : [...prev, name])
  }

  // Guardian fields (shown for minors)
  const [guardianName, setGuardianName] = useState((record.patient as any).guardian_name || '')
  const [guardianAddress, setGuardianAddress] = useState((record.patient as any).guardian_address || '')
  const [guardianPhone, setGuardianPhone] = useState((record.patient as any).guardian_phone || '')

  const isMinor = profileBirthdate
    ? Math.floor((Date.now() - new Date(profileBirthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) < 18
    : false

  // Medical History Form State
  const [bloodType, setBloodType] = useState(record.medicalHistory?.blood_type || '')
  const [bloodPressure, setBloodPressure] = useState(record.medicalHistory?.blood_pressure || '')
  const [medicalFlags, setMedicalFlags] = useState(record.medicalHistory?.medical_flags || '')
  const [allergies, setAllergies] = useState(record.medicalHistory?.allergies?.join(', ') || '')
  const [currentMedications, setCurrentMedications] = useState(record.medicalHistory?.current_medications?.join(', ') || '')
  const [isPregnant, setIsPregnant] = useState(record.medicalHistory?.is_pregnant || false)
  const [isSmoker, setIsSmoker] = useState(record.medicalHistory?.is_smoker || false)

  // Detailed medical history questions from medical_history.png
  const [detailedInfo, setDetailedInfo] = useState<any>(
    record.medicalHistory?.detailed_info || {}
  )

  const AVAILABLE_CONDITIONS = [
    "High Blood Pressure",
    "Low Blood Pressure",
    "Epilepsy / Convulsion",
    "AIDS or HIV Infection",
    "Sexually Transmitted Disease",
    "Stomach Troubles / Ulcers",
    "Fainting Seizure",
    "Rapid Weight Loss",
    "Radiation Therapy",
    "Joint Replacement / Implant",
    "Heart Surgery",
    "Heart Attack",
    "Heart Disease",
    "Heart Murmur",
    "Hepatitis / Liver Disease",
    "Rheumatic Fever",
    "Hay Fever / Allergies",
    "Respiratory Problems",
    "Hepatitis / Jaundice",
    "Tuberculosis",
    "Swollen Ankles",
    "Kidney Disease",
    "Chest Pain",
    "Stroke",
    "Cancer / Tumors",
    "Anemia",
    "Angina",
    "Asthma",
    "Emphysema",
    "Bleeding Problems",
    "Blood Disease",
    "Head Injuries",
    "Arthritis / Rheumatism",
    "Thyroid Problem",
    "Diabetes"
  ]

  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    record.medicalHistory?.medical_conditions || []
  )

  const [otherConditionsText, setOtherConditionsText] = useState<string>(() => {
    const conds = record.medicalHistory?.medical_conditions || []
    const others = conds.filter(c => !AVAILABLE_CONDITIONS.includes(c))
    return others.join(', ')
  })

  const updateDetailedInfo = (key: string, value: any) => {
    setDetailedInfo((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleConditionChange = (condition: string, checked: boolean) => {
    if (checked) {
      setSelectedConditions(prev => [...prev, condition])
    } else {
      setSelectedConditions(prev => prev.filter(c => c !== condition))
    }
  }

  const [isEditingMedical, setIsEditingMedical] = useState(false)
  const [medicalStatus, setMedicalStatus] = useState<{ success?: boolean; error?: string; loading?: boolean }>({})

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileStatus({ loading: true })
    try {
      const res = await updatePatientProfile(record.patient.id, {
        first_name: profileFirst,
        last_name: profileLast,
        phone: profilePhone,
        birthdate: profileBirthdate,
        gender: profileGender,
        address: profileAddress,
        previous_dentist: previousDentist || null,
        hmo_cards: hmoCards,
        ...(isMinor ? { guardian_name: guardianName, guardian_address: guardianAddress, guardian_phone: guardianPhone } : {}),
      })
      if (res.success) {
        setProfileStatus({ success: true })
        setIsEditingProfile(false)
        setTimeout(() => setProfileStatus({}), 3000)
      } else {
        setProfileStatus({ error: res.error || 'Failed to update profile.' })
      }
    } catch (err) {
      setProfileStatus({ error: 'An unexpected error occurred.' })
    }
  }

  // Handle Medical History Update
  const handleMedicalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMedicalStatus({ loading: true })
    try {
      const finalConditions = [
        ...selectedConditions.filter(c => AVAILABLE_CONDITIONS.includes(c)),
        ...otherConditionsText.split(',').map(s => s.trim()).filter(Boolean)
      ]

      const res = await updatePatientMedicalHistory(record.patient.id, {
        blood_type: bloodType || null,
        blood_pressure: bloodPressure || null,
        medical_flags: medicalFlags || null,
        allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        current_medications: currentMedications ? currentMedications.split(',').map(s => s.trim()).filter(Boolean) : [],
        medical_conditions: finalConditions,
        is_pregnant: isPregnant,
        is_smoker: isSmoker,
        detailed_info: detailedInfo,
      })
      if (res.success) {
        setMedicalStatus({ success: true })
        setIsEditingMedical(false)
        setTimeout(() => setMedicalStatus({}), 3000)
      } else {
        setMedicalStatus({ error: res.error || 'Failed to update medical history.' })
      }
    } catch (err) {
      setMedicalStatus({ error: 'An unexpected error occurred.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Onboarding banner for new patients */}
      {isOnboarding && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800">Welcome! Please complete your profile.</p>
            <p className="text-xs text-blue-600 mt-0.5">Fill in your details below before booking an appointment.</p>
          </div>
        </div>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Details
          </CardTitle>
          {!isEditingProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProfile(true)}
              className="font-bold border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Edit Details
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {profileStatus.error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              {profileStatus.error}
            </div>
          )}
          {profileStatus.success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Profile updated successfully!
            </div>
          )}

          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    value={profileFirst}
                    onChange={(e) => setProfileFirst(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={profileLast}
                    onChange={(e) => setProfileLast(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. +639123456789"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Birthdate *</label>
                  <input
                    type="date"
                    required
                    value={profileBirthdate}
                    onChange={(e) => setProfileBirthdate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Gender *</label>
                  <select
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Previous Dentist</label>
                  <input
                    type="text"
                    value={previousDentist}
                    onChange={(e) => setPreviousDentist(e.target.value)}
                    placeholder="Name of previous dentist (optional)"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Home Address *</label>
                  <input
                    type="text"
                    required
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* HMO / Health Cards selection */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">HMO / Health Cards Accepted</label>
                  <div className="flex flex-wrap gap-2">
                    {hmoOptions.length === 0 ? (
                      <span className="text-xs text-gray-500 italic">No HMO options configured for this clinic.</span>
                    ) : (
                      hmoOptions.map(hmo => {
                        const isSelected = hmoCards.includes(hmo)
                        return (
                          <button
                            key={hmo}
                            type="button"
                            onClick={() => toggleHmo(hmo)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-300 text-blue-600'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {hmo}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Minor details / Guardian fields */}
                {isMinor && (
                  <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-2">
                    <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl space-y-4">
                      <div>
                        <p className="text-xs font-bold text-amber-800">Minor Patient detected (under 18 years old)</p>
                        <p className="text-[11px] text-amber-600 mt-0.5">Please provide parent or guardian details below.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-amber-200/40 pt-3">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Guardian Name *</label>
                          <input
                            type="text"
                            required={isMinor}
                            value={guardianName}
                            onChange={(e) => setGuardianName(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Guardian Phone *</label>
                          <input
                            type="text"
                            required={isMinor}
                            value={guardianPhone}
                            onChange={(e) => setGuardianPhone(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Guardian Address *</label>
                          <input
                            type="text"
                            required={isMinor}
                            value={guardianAddress}
                            onChange={(e) => setGuardianAddress(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingProfile(false)
                    setProfileFirst(record.patient.first_name || '')
                    setProfileLast(record.patient.last_name || '')
                    setProfilePhone(isPlaceholderPhone(record.patient.phone) ? '' : record.patient.phone!)
                    setProfileBirthdate(record.patient.birthdate || '')
                    setProfileGender(record.patient.gender || 'male')
                    setProfileAddress(record.patient.address || '')
                    setPreviousDentist((record.patient as any).previous_dentist || '')
                    setHmoCards((record.patient as any).hmo_cards || [])
                    setGuardianName((record.patient as any).guardian_name || '')
                    setGuardianPhone((record.patient as any).guardian_phone || '')
                    setGuardianAddress((record.patient as any).guardian_address || '')
                  }}
                  className="font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 font-bold cursor-pointer"
                  disabled={profileStatus.loading}
                >
                  {profileStatus.loading ? 'Saving...' : 'Save Profile Details'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">First Name</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{profileFirst || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Last Name</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{profileLast || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Email Address</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{record.patient.email || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Phone Number</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{formatPhone(profilePhone)}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Birthdate</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{profileBirthdate || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg capitalize">
                  <span className="text-xs text-slate-400 font-bold uppercase">Gender</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{profileGender || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg col-span-1 sm:col-span-2 md:col-span-3">
                  <span className="text-xs text-slate-400 font-bold uppercase">Home Address</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{profileAddress || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Previous Dentist</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{previousDentist || 'None'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg col-span-1 sm:col-span-2">
                  <span className="text-xs text-slate-400 font-bold uppercase">HMO / Health Cards Accepted</span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {hmoCards.length > 0 ? hmoCards.join(', ') : 'None'}
                  </p>
                </div>
              </div>

              {isMinor && (
                <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Parent / Guardian Details (Minor)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">GUARDIAN NAME</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{guardianName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">GUARDIAN PHONE</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{guardianPhone || '—'}</p>
                    </div>
                    <div className="sm:col-span-2 md:col-span-3">
                      <span className="text-[10px] text-slate-400 block font-semibold">GUARDIAN ADDRESS</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{guardianAddress || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Summary / Form Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Medical History Summary
          </CardTitle>
          {!isEditingMedical && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingMedical(true)}
              className="font-bold border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Edit History
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {medicalStatus.error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              {medicalStatus.error}
            </div>
          )}
          {medicalStatus.success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Medical history updated successfully!
            </div>
          )}

          {isEditingMedical ? (
            <form onSubmit={handleMedicalSubmit} className="space-y-6">
              {/* Section 1: General Medical Specs */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-1.5">General Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Blood Type</label>
                    <select
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unknown</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Blood Pressure</label>
                    <input
                      type="text"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      placeholder="e.g. 120/80 mmHg"
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Last Dental Visit</label>
                    <input
                      type="text"
                      value={detailedInfo.last_dental_visit || ''}
                      onChange={(e) => updateDetailedInfo('last_dental_visit', e.target.value)}
                      placeholder="Approximate date or month/year"
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Bleeding Time</label>
                    <input
                      type="text"
                      value={detailedInfo.bleeding_time || ''}
                      onChange={(e) => updateDetailedInfo('bleeding_time', e.target.value)}
                      placeholder="e.g. 2 minutes"
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Medical Flags / Known Alerts</label>
                    <input
                      type="text"
                      value={medicalFlags}
                      onChange={(e) => setMedicalFlags(e.target.value)}
                      placeholder="e.g. Severe asthma, heart condition, penicillin allergy"
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Physician Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-1.5">Physician Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Physician Name</label>
                    <input
                      type="text"
                      value={detailedInfo.physician_name || ''}
                      onChange={(e) => updateDetailedInfo('physician_name', e.target.value)}
                      placeholder="Dr. John Doe"
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Specialty</label>
                    <input
                      type="text"
                      value={detailedInfo.physician_specialty || ''}
                      onChange={(e) => updateDetailedInfo('physician_specialty', e.target.value)}
                      placeholder="Cardiologist, etc."
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Office Address</label>
                    <input
                      type="text"
                      value={detailedInfo.physician_office_address || ''}
                      onChange={(e) => updateDetailedInfo('physician_office_address', e.target.value)}
                      placeholder="Physician office address"
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Office Phone Number/s</label>
                    <input
                      type="text"
                      value={detailedInfo.physician_office_phone || ''}
                      onChange={(e) => updateDetailedInfo('physician_office_phone', e.target.value)}
                      placeholder="Contact number"
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: General Health Questionnaire */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-1.5">Health Questionnaire</h3>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-2">
                    <span className="text-xs font-semibold text-slate-700">1. Are you in good health condition?</span>
                    <select
                      value={detailedInfo.good_condition || ''}
                      onChange={(e) => updateDetailedInfo('good_condition', e.target.value)}
                      className="border border-slate-200 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select option</option>
                      <option value="yes">YES</option>
                      <option value="no">NO</option>
                    </select>
                  </div>

                  <div className="border-b border-slate-50 pb-2.5 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700">2. Are you under medical treatment now?</span>
                      <select
                        value={detailedInfo.under_medical_treatment || ''}
                        onChange={(e) => updateDetailedInfo('under_medical_treatment', e.target.value)}
                        className="border border-slate-200 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select option</option>
                        <option value="yes">YES</option>
                        <option value="no">NO</option>
                      </select>
                    </div>
                    {detailedInfo.under_medical_treatment === 'yes' && (
                      <input
                        type="text"
                        value={detailedInfo.under_medical_treatment_desc || ''}
                        onChange={(e) => updateDetailedInfo('under_medical_treatment_desc', e.target.value)}
                        placeholder="What condition is being treated?"
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    )}
                  </div>

                  <div className="border-b border-slate-50 pb-2.5 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700">3. Have you ever had a serious illness or surgical operation?</span>
                      <select
                        value={detailedInfo.serious_illness_operation || ''}
                        onChange={(e) => updateDetailedInfo('serious_illness_operation', e.target.value)}
                        className="border border-slate-200 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select option</option>
                        <option value="yes">YES</option>
                        <option value="no">NO</option>
                      </select>
                    </div>
                    {detailedInfo.serious_illness_operation === 'yes' && (
                      <input
                        type="text"
                        value={detailedInfo.serious_illness_operation_desc || ''}
                        onChange={(e) => updateDetailedInfo('serious_illness_operation_desc', e.target.value)}
                        placeholder="What illness or operation?"
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    )}
                  </div>

                  <div className="border-b border-slate-50 pb-2.5 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700">4. Have you ever been hospitalized?</span>
                      <select
                        value={detailedInfo.hospitalized || ''}
                        onChange={(e) => updateDetailedInfo('hospitalized', e.target.value)}
                        className="border border-slate-200 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select option</option>
                        <option value="yes">YES</option>
                        <option value="no">NO</option>
                      </select>
                    </div>
                    {detailedInfo.hospitalized === 'yes' && (
                      <input
                        type="text"
                        value={detailedInfo.hospitalized_desc || ''}
                        onChange={(e) => updateDetailedInfo('hospitalized_desc', e.target.value)}
                        placeholder="When and why?"
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    )}
                  </div>

                  <div className="border-b border-slate-50 pb-2.5 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700">5. Are you taking any prescription / non-prescription medication?</span>
                      <select
                        value={detailedInfo.prescription_medication || ''}
                        onChange={(e) => updateDetailedInfo('prescription_medication', e.target.value)}
                        className="border border-slate-200 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select option</option>
                        <option value="yes">YES</option>
                        <option value="no">NO</option>
                      </select>
                    </div>
                    {detailedInfo.prescription_medication === 'yes' && (
                      <input
                        type="text"
                        value={detailedInfo.prescription_medication_desc || ''}
                        onChange={(e) => updateDetailedInfo('prescription_medication_desc', e.target.value)}
                        placeholder="Please specify medication"
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                    <span className="text-xs font-semibold text-slate-700">6. Do you use tobacco products?</span>
                    <input
                      type="checkbox"
                      checked={isSmoker}
                      onChange={(e) => setIsSmoker(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                    <span className="text-xs font-semibold text-slate-700">7. Do you use alcohol, cocaine or other dangerous drugs?</span>
                    <select
                      value={detailedInfo.drug_use || ''}
                      onChange={(e) => updateDetailedInfo('drug_use', e.target.value)}
                      className="border border-slate-200 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select option</option>
                      <option value="yes">YES</option>
                      <option value="no">NO</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Allergies Checklist */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-1.5">Allergy List (Place check under Yes/No)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={detailedInfo.allergy_local_anesthetic || false}
                      onChange={(e) => updateDetailedInfo('allergy_local_anesthetic', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Local Anesthetic (ex. Lidocaine)
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={detailedInfo.allergy_penicillin || false}
                      onChange={(e) => updateDetailedInfo('allergy_penicillin', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Penicillin / Antibiotics
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={detailedInfo.allergy_sulfa || false}
                      onChange={(e) => updateDetailedInfo('allergy_sulfa', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Sulfa Drugs
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={detailedInfo.allergy_aspirin || false}
                      onChange={(e) => updateDetailedInfo('allergy_aspirin', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Aspirin
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={detailedInfo.allergy_latex || false}
                      onChange={(e) => updateDetailedInfo('allergy_latex', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Latex
                  </label>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Other Allergies</label>
                    <input
                      type="text"
                      value={detailedInfo.allergy_other || ''}
                      onChange={(e) => updateDetailedInfo('allergy_other', e.target.value)}
                      placeholder="Specify other allergy"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: For Women Only */}
              {profileGender === 'female' && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-bold text-slate-800">For Women Only</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-3 rounded-lg border">
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPregnant}
                        onChange={(e) => setIsPregnant(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      Are you pregnant?
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={detailedInfo.is_nursing || false}
                        onChange={(e) => updateDetailedInfo('is_nursing', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      Are you nursing?
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={detailedInfo.is_birth_control || false}
                        onChange={(e) => updateDetailedInfo('is_birth_control', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      Are you taking birth control pills?
                    </label>
                  </div>
                </div>
              )}

              {/* Section 6: Conditions Checklist */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-bold text-slate-800">Do you have or have you had any of the following? Check which apply:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_CONDITIONS.map((condition) => {
                    const isChecked = selectedConditions.includes(condition)
                    return (
                      <label key={condition} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleConditionChange(condition, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        {condition}
                      </label>
                    )
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Other Conditions (comma-separated)</label>
                  <input
                    type="text"
                    value={otherConditionsText}
                    onChange={(e) => setOtherConditionsText(e.target.value)}
                    placeholder="Specify other conditions"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Common Manual entries for medications and allergies */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-bold text-slate-800">General Medications & Allergies Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                      Allergies Summary (comma-separated list for profile)
                    </label>
                    <input
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g. Penicillin, Peanuts, Latex"
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                      Current Medications (comma-separated list for profile)
                    </label>
                    <input
                      type="text"
                      value={currentMedications}
                      onChange={(e) => setCurrentMedications(e.target.value)}
                      placeholder="e.g. Insulin, Metformin"
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingMedical(false)
                    setBloodType(record.medicalHistory?.blood_type || '')
                    setBloodPressure(record.medicalHistory?.blood_pressure || '')
                    setMedicalFlags(record.medicalHistory?.medical_flags || '')
                    setAllergies(record.medicalHistory?.allergies?.join(', ') || '')
                    setCurrentMedications(record.medicalHistory?.current_medications?.join(', ') || '')
                    setSelectedConditions(record.medicalHistory?.medical_conditions || [])
                    setOtherConditionsText(() => {
                      const conds = record.medicalHistory?.medical_conditions || []
                      const others = conds.filter(c => !AVAILABLE_CONDITIONS.includes(c))
                      return others.join(', ')
                    })
                    setIsPregnant(record.medicalHistory?.is_pregnant || false)
                    setIsSmoker(record.medicalHistory?.is_smoker || false)
                    setDetailedInfo(record.medicalHistory?.detailed_info || {})
                  }}
                  className="font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 font-bold cursor-pointer"
                  disabled={medicalStatus.loading}
                >
                  {medicalStatus.loading ? 'Saving...' : 'Save Medical History'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* View Mode layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Blood Type</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{bloodType || 'Unknown'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Blood Pressure</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{bloodPressure || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Last Dental Visit</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{detailedInfo.last_dental_visit || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Bleeding Time</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{detailedInfo.bleeding_time || '—'}</p>
                </div>
                {profileGender === 'female' && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">Women-Only Specs</span>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      Pregnant: <span className="font-bold">{isPregnant ? "YES" : "NO"}</span> · 
                      Nursing: <span className="font-bold">{detailedInfo.is_nursing ? "YES" : "NO"}</span> · 
                      Pills: <span className="font-bold">{detailedInfo.is_birth_control ? "YES" : "NO"}</span>
                    </p>
                  </div>
                )}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">Tobacco / Smoking</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{isSmoker ? "YES (Tobacco User)" : "NO"}</p>
                </div>
              </div>

              {medicalFlags && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Medical Flags / Alerts</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{medicalFlags}</p>
                </div>
              )}

              {/* Physician card */}
              <div className="p-4 bg-slate-50/50 border border-slate-150 rounded-xl space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase block">Primary Physician</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-xs">
                  <p className="text-slate-600"><span className="font-bold text-slate-700">Name:</span> {detailedInfo.physician_name || '—'}</p>
                  <p className="text-slate-600"><span className="font-bold text-slate-700">Specialty:</span> {detailedInfo.physician_specialty || '—'}</p>
                  <p className="text-slate-600"><span className="font-bold text-slate-700">Office Address:</span> {detailedInfo.physician_office_address || '—'}</p>
                  <p className="text-slate-600"><span className="font-bold text-slate-700">Office Phone:</span> {detailedInfo.physician_office_phone || '—'}</p>
                </div>
              </div>

              {/* Health Questionnaire Responses */}
              <div className="p-4 bg-slate-50/50 border border-slate-150 rounded-xl space-y-2.5">
                <span className="text-xs text-slate-400 font-bold uppercase block">Health Questionnaire Summary</span>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <p>1. In good health condition? <span className="font-bold text-slate-900 capitalize">{detailedInfo.good_condition || '—'}</span></p>
                  <p>2. Under medical treatment? <span className="font-bold text-slate-900 capitalize">{detailedInfo.under_medical_treatment || '—'}</span>
                    {detailedInfo.under_medical_treatment === 'yes' && detailedInfo.under_medical_treatment_desc && ` (${detailedInfo.under_medical_treatment_desc})`}
                  </p>
                  <p>3. Had serious illness / operation? <span className="font-bold text-slate-900 capitalize">{detailedInfo.serious_illness_operation || '—'}</span>
                    {detailedInfo.serious_illness_operation === 'yes' && detailedInfo.serious_illness_operation_desc && ` (${detailedInfo.serious_illness_operation_desc})`}
                  </p>
                  <p>4. Ever been hospitalized? <span className="font-bold text-slate-900 capitalize">{detailedInfo.hospitalized || '—'}</span>
                    {detailedInfo.hospitalized === 'yes' && detailedInfo.hospitalized_desc && ` (${detailedInfo.hospitalized_desc})`}
                  </p>
                  <p>5. Taking prescription / non-prescription meds? <span className="font-bold text-slate-900 capitalize">{detailedInfo.prescription_medication || '—'}</span>
                    {detailedInfo.prescription_medication === 'yes' && detailedInfo.prescription_medication_desc && ` (${detailedInfo.prescription_medication_desc})`}
                  </p>
                  <p>6. Uses alcohol / other drugs? <span className="font-bold text-slate-900 capitalize">{detailedInfo.drug_use || '—'}</span></p>
                </div>
              </div>

              {/* Allergy checklist answers */}
              <div className="p-4 bg-slate-50/50 border border-slate-150 rounded-xl space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase block">Allergy Checklist Details</span>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">Local Anesthetic:</span> {detailedInfo.allergy_local_anesthetic ? "YES" : "NO"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">Penicillin / Antibiotics:</span> {detailedInfo.allergy_penicillin ? "YES" : "NO"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">Sulfa Drugs:</span> {detailedInfo.allergy_sulfa ? "YES" : "NO"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">Aspirin:</span> {detailedInfo.allergy_aspirin ? "YES" : "NO"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">Latex:</span> {detailedInfo.allergy_latex ? "YES" : "NO"}
                  </div>
                  {detailedInfo.allergy_other && (
                    <div className="w-full mt-1">
                      <span className="font-bold">Other allergies specified:</span> {detailedInfo.allergy_other}
                    </div>
                  )}
                </div>
              </div>

              {/* general overview list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Allergies Summary</span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {allergies ? allergies : "None declared"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Current Medications</span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {currentMedications ? currentMedications : "None declared"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg sm:col-span-2">
                  <span className="text-xs text-slate-400 font-bold uppercase">Medical Conditions</span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {selectedConditions.length > 0 || otherConditionsText 
                      ? [
                          ...selectedConditions.filter(c => AVAILABLE_CONDITIONS.includes(c)),
                          ...otherConditionsText.split(',').map(s => s.trim()).filter(Boolean)
                        ].join(', ') 
                      : "None declared"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
