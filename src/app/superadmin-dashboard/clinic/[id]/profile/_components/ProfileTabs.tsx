'use client'

import { useState } from 'react'
import { Building2, Clock, Shield, ImageIcon } from 'lucide-react'
import GeneralInfoForm from './GeneralInfoForm'
import OperatingHoursForm from './OperatingHoursForm'
import HMOsSpecialtiesForm from './HMOsSpecialtiesForm'
import GalleryForm from './GalleryForm'

const TABS = [
  { key: 'general', label: 'General Info', icon: Building2 },
  { key: 'hours', label: 'Operating Hours', icon: Clock },
  { key: 'specialties', label: 'Specialties', icon: Shield },
  { key: 'gallery', label: 'Gallery', icon: ImageIcon },
]

interface Props {
  clinicId: number
  clinic: Record<string, unknown>
  operatingHours: Record<string, unknown>[]
  specialties: Record<string, unknown>[]
  gallery: Record<string, unknown>[]
}

export default function ProfileTabs({
  clinicId, clinic, operatingHours, specialties, gallery
}: Props) {
  const [active, setActive] = useState('general')

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tab bar */}
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

      {/* Tab content */}
      <div className="p-6">
        {active === 'general' && <GeneralInfoForm clinicId={clinicId} clinic={clinic} />}
        {active === 'hours' && <OperatingHoursForm clinicId={clinicId} operatingHours={operatingHours} />}
        {active === 'specialties' && <HMOsSpecialtiesForm clinicId={clinicId} specialties={specialties} />}
        {active === 'gallery' && <GalleryForm clinicId={clinicId} gallery={gallery} />}
      </div>
    </div>
  )
}
