'use client'

import SearchAndFilterBar, { type FilterDef } from '@/components/common/SearchAndFilterBar'

interface PersonnelFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  clinicFilter: string
  onClinicChange: (clinicId: string | number) => void
  clinics: { id: number; name: string }[]
}

export default function PersonnelFilterBar({
  searchQuery,
  onSearchChange,
  clinicFilter,
  onClinicChange,
  clinics,
}: PersonnelFilterBarProps) {
  const filters: FilterDef[] = [
    {
      id: 'clinic',
      label: 'Clinic Filter',
      value: clinicFilter,
      onChange: onClinicChange,
      options: [
        { label: 'All Clinics', value: 'all' },
        ...clinics.map((clinic) => ({
          label: clinic.name,
          value: clinic.id.toString(),
        })),
      ],
    },
  ]

  return (
    <SearchAndFilterBar
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by name or email..."
      filters={filters}
    />
  )
}
