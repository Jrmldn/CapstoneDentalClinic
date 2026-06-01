'use client'

import DataTable, { type ColumnDef } from '@/components/common/DataTable'
import { deletePersonnel } from '@/actions/personnelActions'

export interface StaffMember {
  id: number
  userId: string
  firstName: string
  lastName: string
  email: string
  clinicName: string
}

interface StaffTableProps {
  staff: StaffMember[]
  onRefresh?: () => void
  onEdit: (staff: StaffMember) => void
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function StaffTable({
  staff,
  onRefresh,
  onEdit,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
}: StaffTableProps) {
  const columns: ColumnDef<StaffMember>[] = [
    {
      key: 'firstName',
      label: 'Name',
      render: (_, member) => `${member.firstName} ${member.lastName}`,
    },
    { key: 'email', label: 'Email' },
    { key: 'clinicName', label: 'Clinic' },
  ]

  return (
    <DataTable<StaffMember>
      data={staff}
      columns={columns}
      getRowKey={(member) => member.userId}
      onEdit={onEdit}
      onDelete={async (member) => await deletePersonnel(member.userId)}
      currentPage={currentPage}
      totalCount={totalCount}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      onRefresh={onRefresh}
      emptyMessage="No staff members found. Add one to get started."
    />
  )
}