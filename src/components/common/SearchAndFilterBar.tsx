'use client'

import { Search, Filter } from 'lucide-react'

export type FilterOption = {
  label: string
  value: string | number
}

export type FilterDef = {
  id: string
  label: string
  value: string | number
  onChange: (value: string | number) => void
  options: FilterOption[]
}

interface SearchAndFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string
  filters?: FilterDef[]
}

export default function SearchAndFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
}: SearchAndFilterBarProps) {
  const hasFilters = filters.length > 0

  return (
    <div className={`flex flex-col ${hasFilters ? 'sm:flex-row gap-4' : 'gap-4'} mb-6`}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition text-sm"
        />
      </div>

      {/* Dynamic Filters */}
      {filters.map((filter) => (
        <div key={filter.id} className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filter.value}
            onChange={(e) =>
              filter.onChange(
                isNaN(Number(e.target.value))
                  ? e.target.value
                  : Number(e.target.value)
              )
            }
            className="w-full pl-10 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition appearance-none bg-white text-sm cursor-pointer"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
            ▼
          </div>
        </div>
      ))}
    </div>
  )
}
