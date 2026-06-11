'use client'

import React, { useState } from 'react'
import { User, ShieldAlert, CheckCircle2, Heart } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updatePatientProfile, updatePatientMedicalHistory } from '@/actions/patientActions'
import { PatientRecord } from './types'

interface ProfileTabProps {
  record: PatientRecord
}

export function ProfileTab({ record }: ProfileTabProps) {
  const [profileStatus, setProfileStatus] = useState<{ success?: boolean; error?: string; loading?: boolean }>({})

  // Profile Form State
  const [profileFirst, setProfileFirst] = useState(record.patient.first_name || '')
  const [profileLast, setProfileLast] = useState(record.patient.last_name || '')
  const [profilePhone, setProfilePhone] = useState(
    record.patient.phone && !record.patient.phone.startsWith('Update required')
      ? record.patient.phone
      : ''
  )
  const [profileBirthdate, setProfileBirthdate] = useState(record.patient.birthdate || '')
  const [profileGender, setProfileGender] = useState(record.patient.gender || 'male')
  const [profileAddress, setProfileAddress] = useState(record.patient.address || '')

  // Medical History Form State
  const [bloodType, setBloodType] = useState(record.medicalHistory?.blood_type || '')
  const [bloodPressure, setBloodPressure] = useState(record.medicalHistory?.blood_pressure || '')
  const [medicalFlags, setMedicalFlags] = useState(record.medicalHistory?.medical_flags || '')
  const [allergies, setAllergies] = useState(record.medicalHistory?.allergies?.join(', ') || '')
  const [currentMedications, setCurrentMedications] = useState(record.medicalHistory?.current_medications?.join(', ') || '')
  const [medicalConditions, setMedicalConditions] = useState(record.medicalHistory?.medical_conditions?.join(', ') || '')
  const [isPregnant, setIsPregnant] = useState(record.medicalHistory?.is_pregnant || false)
  const [isSmoker, setIsSmoker] = useState(record.medicalHistory?.is_smoker || false)

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
        address: profileAddress
      })
      if (res.success) {
        setProfileStatus({ success: true })
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
      const res = await updatePatientMedicalHistory(record.patient.id, {
        blood_type: bloodType || null,
        blood_pressure: bloodPressure || null,
        medical_flags: medicalFlags || null,
        allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        current_medications: currentMedications ? currentMedications.split(',').map(s => s.trim()).filter(Boolean) : [],
        medical_conditions: medicalConditions ? medicalConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        is_pregnant: isPregnant,
        is_smoker: isSmoker,
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">First Name</label>
                <input
                  type="text"
                  value={profileFirst}
                  onChange={(e) => setProfileFirst(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={profileLast}
                  onChange={(e) => setProfileLast(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Email Address</label>
              <input
                type="email"
                value={record.patient.email || ''}
                readOnly
                disabled
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Your email is managed by your account sign-in method and cannot be edited.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="09XXXXXXXXX"
                  className={`w-full border rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !profilePhone
                      ? 'border-red-300 placeholder:text-slate-400'
                      : 'border-slate-200'
                  }`}
                  required
                />
                {!profilePhone && (
                  <p className="text-[10px] text-red-500 mt-1 uppercase">Update Required</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Birth Date</label>
                <input
                  type="date"
                  value={profileBirthdate}
                  onChange={(e) => setProfileBirthdate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Gender</label>
                <select
                  value={profileGender}
                  onChange={(e) => setProfileGender(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Home Address</label>
              <input
                type="text"
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
              disabled={profileStatus.loading}
            >
              {profileStatus.loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </form>
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
            <form onSubmit={handleMedicalSubmit} className="space-y-4">
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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-red-400 mb-1.5">Medical Flags / Known Alerts</label>
                  <input
                    type="text"
                    value={medicalFlags}
                    onChange={(e) => setMedicalFlags(e.target.value)}
                    placeholder="e.g. Penicillin allergy, Latex sensitivity"
                    className="w-full border border-red-200 rounded-lg p-2.5 bg-red-50/30 focus:outline-none focus:ring-2 focus:ring-red-400 text-red-700 placeholder:text-red-300"
                  />
                </div>

                <div className="flex flex-col justify-end gap-3 pb-1">
                  {profileGender === 'female' && (
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isPregnant}
                        onChange={(e) => setIsPregnant(e.target.checked)}
                        className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Currently Pregnant
                    </label>
                  )}
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSmoker}
                      onChange={(e) => setIsSmoker(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Active Smoker
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Allergies (comma-separated)
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
                  Current Medications (comma-separated)
                </label>
                <input
                  type="text"
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="e.g. Insulin, Metformin"
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Medical Conditions (comma-separated)
                </label>
                <input
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="e.g. Diabetes, Hypertension, Asthma"
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-550"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
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
                    setMedicalConditions(record.medicalHistory?.medical_conditions?.join(', ') || '')
                    setIsPregnant(record.medicalHistory?.is_pregnant || false)
                    setIsSmoker(record.medicalHistory?.is_smoker || false)
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Blood Type</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{bloodType || 'Unknown'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Blood Pressure</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{bloodPressure || '—'}</p>
                </div>
                {medicalFlags && (
                  <div className="sm:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-xs text-red-500 font-bold uppercase">⚠ Medical Flags / Alerts</span>
                    <p className="text-sm font-bold text-red-700 mt-0.5">{medicalFlags}</p>
                  </div>
                )}
                 <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-center gap-2">
                  {profileGender === 'female' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-slate-400">Pregnancy Status:</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {isPregnant ? "Pregnant" : "Not Pregnant"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-slate-400">Smoking Status:</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {isSmoker ? "Smoker" : "Non-smoker"}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs text-slate-400 font-bold uppercase">Allergies</span>
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
                    {medicalConditions ? medicalConditions : "None declared"}
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
