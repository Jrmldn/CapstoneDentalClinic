'use client'

import { Search, Filter } from 'lucide-react'

interface ClinicFiltersProps {
  onFilterChange?: (filters: any) => void
}

export default function ClinicFilters({ onFilterChange }: ClinicFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Label"
          className="w-full pl-12 pr-4 py-3 bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* Filter Button */}
      <button className="inline-flex items-center gap-2 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium">
        <Filter className="w-4 h-4" />
        Filter
      </button>
    </div>
  )
}
