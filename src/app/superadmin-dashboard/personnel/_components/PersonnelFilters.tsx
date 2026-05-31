'use client'

import { Search, Filter } from 'lucide-react'

interface PersonnelFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  clinicFilter: string
  setClinicFilter: (clinic: string) => void
  clinics: { id: number; name: string }[]
}

export default function PersonnelFilters({
  searchQuery,
  setSearchQuery,
  clinicFilter,
  setClinicFilter,
  clinics,
}: PersonnelFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition text-sm"
        />
      </div>

      {/* Clinic Filter Dropdown */}
      <div className="relative min-w-[200px]">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <select
          value={clinicFilter}
          onChange={(e) => setClinicFilter(e.target.value)}
          className="w-full pl-10 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition appearance-none bg-white text-sm cursor-pointer"
        >
          <option value="all">All Clinics</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id.toString()}>
              {clinic.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
          ▼
        </div>
      </div>
    </div>
  )
}
