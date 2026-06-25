'use client'

import SearchAndFilterBar, { type FilterDef } from '@/components/common/SearchAndFilterBar'

interface PersonnelFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  clinicFilter: string
  onClinicChange: (clinicId: string | number) => void
  clinics: { id: number; name: string }[]
  roleFilter: string
  onRoleChange: (v: string) => void
  statusFilter: string
  onStatusChange: (v: string) => void
}

export default function PersonnelFilterBar({
  searchQuery,
  onSearchChange,
  clinicFilter,
  onClinicChange,
  clinics,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
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
    {
      id: 'role',
      label: 'Role Filter',
      value: roleFilter,
      onChange: onRoleChange,
      options: [
        { label: 'All Roles', value: 'all' },
        { label: 'Staff', value: 'staff' },
        { label: 'Dentist', value: 'dentist' },
      ],
    },
    {
      id: 'status',
      label: 'Status Filter',
      value: statusFilter,
      onChange: onStatusChange,
      options: [
        { label: 'All Status', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
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
