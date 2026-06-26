'use client'

import { useState } from 'react'
import { Building2, Clock, ImageIcon, CalendarX } from 'lucide-react'
import GeneralInfoForm from './GeneralInfoForm'
import OperatingHoursForm from './OperatingHoursForm'
import GalleryForm from './GalleryForm'
import HolidaysForm from './HolidaysForm'

interface ClinicHoliday {
  id: number
  date: string
  description: string | null
  is_special_day: boolean | null
}

const TABS = [
  { key: 'general',  label: 'General Info',    icon: Building2 },
  { key: 'hours',    label: 'Operating Hours', icon: Clock     },
  { key: 'gallery',  label: 'Gallery',         icon: ImageIcon },
  { key: 'holidays', label: 'Holidays',        icon: CalendarX },
]

interface Props {
  clinicId: number
  clinic: Record<string, unknown>
  operatingHours: Record<string, unknown>[]
  gallery: Record<string, unknown>[]
  holidays: ClinicHoliday[]
}

export default function ProfileTabs({
  clinicId, clinic, operatingHours, gallery, holidays,
}: Props) {
  const [active, setActive] = useState('general')

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              id={`profile-tab-${tab.key}`}
              onClick={() => setActive(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isActive
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="p-6">
        {active === 'general'  && <GeneralInfoForm clinicId={clinicId} clinic={clinic} />}
        {active === 'hours'    && <OperatingHoursForm clinicId={clinicId} operatingHours={operatingHours} />}
        {active === 'gallery'  && <GalleryForm clinicId={clinicId} gallery={gallery} />}
        {active === 'holidays' && <HolidaysForm clinicId={clinicId} initialHolidays={holidays} />}
      </div>
    </div>
  )
}
