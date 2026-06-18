'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, ShieldAlert, CheckCircle2, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updatePatientProfile } from '@/actions/patientActions'
import { PatientRecord } from './types'
import { isPlaceholderPhone, formatPhone } from '@/utils/phone-helpers'

interface ProfileTabProps {
  record: PatientRecord
}

export function ProfileTab({ record }: ProfileTabProps) {
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

  // Guardian fields (shown for minors)
  const [guardianName, setGuardianName] = useState((record.patient as any).guardian_name || '')
  const [guardianAddress, setGuardianAddress] = useState((record.patient as any).guardian_address || '')
  const [guardianPhone, setGuardianPhone] = useState((record.patient as any).guardian_phone || '')

  const isMinor = profileBirthdate
    ? Math.floor((Date.now() - new Date(profileBirthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) < 18
    : false



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
    </div>
  )
}
