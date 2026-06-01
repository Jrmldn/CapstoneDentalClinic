'use client'

import DataTable, { type ColumnDef } from '@/components/common/DataTable'
import { deletePersonnel } from '@/actions/personnelActions'

export interface Dentist {
  id: number
  userId: string
  firstName: string
  lastName: string
  email: string
  clinicName: string
  specialty: string
}

interface DentistTableProps {
  dentists: Dentist[]
  onRefresh?: () => void
  onEdit: (dentist: Dentist) => void
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function DentistTable({
  dentists,
  onRefresh,
  onEdit,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
}: DentistTableProps) {
  const columns: ColumnDef<Dentist>[] = [
    {
      key: 'firstName',
      label: 'Name',
      render: (_, dentist) => `Dr. ${dentist.firstName} ${dentist.lastName}`,
    },
    {
      key: 'specialty',
      label: 'Specialty',
      render: (specialty) => specialty || 'General Dentistry',
    },
    { key: 'email', label: 'Email' },
    { key: 'clinicName', label: 'Clinic' },
  ]

  return (
    <DataTable<Dentist>
      data={dentists}
      columns={columns}
      getRowKey={(dentist) => dentist.userId}
      onEdit={onEdit}
      onDelete={async (dentist) => await deletePersonnel(dentist.userId)}
      currentPage={currentPage}
      totalCount={totalCount}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      onRefresh={onRefresh}
      emptyMessage="No dentists found. Add one to get started."
    />
  )
}