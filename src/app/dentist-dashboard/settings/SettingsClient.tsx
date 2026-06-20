'use client'

import { useState, useTransition } from 'react'
import { User, Clock, Check, RefreshCw } from 'lucide-react'
import { updateDentistWorkingHours, updateDentistProfile } from '@/actions/dentistScheduleActions'

export interface WorkingHour {
  day_of_week: number
  start_time: string
  end_time: string
}

interface SettingsClientProps {
  dentistId: number
  clinicName: string
  dentistEmail: string
  initialFirstName: string
  initialLastName: string
  initialSpecialty: string
  initialWorkingHours: WorkingHour[]
  initialLicenseNo: string
}

export default function SettingsClient({
  dentistId,
  clinicName,
  dentistEmail,
  initialFirstName,
  initialLastName,
  initialSpecialty,
  initialWorkingHours,
  initialLicenseNo,
}: SettingsClientProps) {
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [specialty, setSpecialty] = useState(initialSpecialty)
  const [licenseNo, setLicenseNo] = useState(initialLicenseNo)

  // Mocked for display as per mockup
  const [contactNo, setContactNo] = useState('+63 917 000 1234')

  // Working Hours states
  const firstHours = initialWorkingHours[0]
  const [startTime, setStartTime] = useState(firstHours?.start_time?.substring(0, 5) || '08:00')
  const [endTime, setEndTime] = useState(firstHours?.end_time?.substring(0, 5) || '17:00')
  const [slotDuration, setSlotDuration] = useState('30')
  const [isPending, startTransition] = useTransition()

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateDentistProfile(dentistId, {
        first_name: firstName,
        last_name: lastName,
        specialty: specialty,
        license_no: licenseNo,
      })
      if (res.success) {
        alert('Profile updated successfully!')
      } else {
        alert(res.error || 'Failed to update profile')
      }
    })
  }

  const handleSaveWorkingHours = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      // Update working hours for weekdays Mon-Fri (1 to 5) or all days (0 to 6)
      const availabilities = Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
      }))

      const res = await updateDentistWorkingHours(dentistId, availabilities)

      if (res.success) {
        alert('Working hours and slot duration updated successfully!')
      } else {
        alert(res.error || 'Failed to update working hours')
      }
    })
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Profile Card */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">Profile Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">First Name</span>
            <input
              type="text"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Last Name</span>
            <input
              type="text"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">License No.</span>
            <input
              type="text"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
              value={licenseNo}
              onChange={e => setLicenseNo(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Specialization</span>
            <input
              type="text"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Clinic</span>
            <input
              type="text"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-slate-100 text-slate-500 outline-none font-bold"
              value={clinicName}
              disabled
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
            <input
              type="email"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-slate-100 text-slate-500 outline-none font-bold"
              value={dentistEmail}
              disabled
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</span>
            <input
              type="text"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
              value={contactNo}
              onChange={e => setContactNo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            Save Profile
          </button>
        </div>
      </form>

      {/* Working Hours Card */}
      <form onSubmit={handleSaveWorkingHours} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">Working Hours</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Start Time</span>
            <input
              type="time"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">End Time</span>
            <input
              type="time"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Slot Duration (min)</span>
            <input
              type="number"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
              value={slotDuration}
              onChange={e => setSlotDuration(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-50"
          >
            {isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Working Hours
          </button>
        </div>
      </form>
    </div>
  )
}
