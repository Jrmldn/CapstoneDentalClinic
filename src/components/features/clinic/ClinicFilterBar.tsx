'use client'

import SearchAndFilterBar, { type FilterDef } from '@/components/common/SearchAndFilterBar'

interface ClinicFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusChange: (status: string | number) => void
}

export default function ClinicFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: ClinicFilterBarProps) {
  const filters: FilterDef[] = [
    {
      id: 'status',
      label: 'Status Filter',
      value: statusFilter,
      onChange: onStatusChange,
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Active Only', value: 'active' },
        { label: 'Inactive Only', value: 'inactive' },
      ],
    },
  ]

  return (
    <SearchAndFilterBar
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search clinics by name or email..."
      filters={filters}
    />
  )
}
