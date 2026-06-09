'use client'

import React, { useState } from 'react'
import { User, ShieldAlert, CheckCircle2, Heart } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updatePatientProfile } from '@/actions/patientActions'
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

      {/* Medical Summary Read-only Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Medical History Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {record.medicalHistory ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-xs text-slate-400 font-bold uppercase">Blood Type</span>
                <p className="text-sm font-bold text-slate-800">{record.medicalHistory.blood_type || 'Unknown'}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-xs text-slate-400 font-bold uppercase">Allergies</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {record.medicalHistory.allergies.length > 0 ? (
                    record.medicalHistory.allergies.map((a, i) => (
                      <Badge key={i} variant="secondary" className="bg-red-50 text-red-600 border-red-100 font-semibold">{a}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">None declared</span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-xs text-slate-400 font-bold uppercase">Current Medications</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {record.medicalHistory.current_medications.length > 0 ? (
                    record.medicalHistory.current_medications.map((m, i) => (
                      <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 font-semibold">{m}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">None declared</span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-xs text-slate-400 font-bold uppercase">Medical Conditions</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {record.medicalHistory.medical_conditions.length > 0 ? (
                    record.medicalHistory.medical_conditions.map((c, i) => (
                      <Badge key={i} variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 font-semibold">{c}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">None declared</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No medical history on file</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
