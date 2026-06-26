'use client'

import DataTable, { type ColumnDef, type RowAction } from '@/components/common/DataTable'
import { Ban, UserCheck } from 'lucide-react'
import { FormattedStaff } from '@/types/clinic'

interface StaffTableProps {
  staff: FormattedStaff[]
  onRefresh?: () => void
  onEdit: (staff: FormattedStaff) => void
  onDisable: (staff: FormattedStaff) => void
  onEnable: (staff: FormattedStaff) => void | Promise<void>
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function StaffTable({
  staff,
  onRefresh,
  onEdit,
  onDisable,
  onEnable,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
}: StaffTableProps) {
  const columns: ColumnDef<FormattedStaff>[] = [
    {
      key: 'firstName',
      label: 'Name',
      render: (_, member) => (
        <span className="flex items-center gap-2">
          {`${member.firstName} ${member.lastName}`}
          {member.isDisabled && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
              Disabled
            </span>
          )}
        </span>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'clinicName', label: 'Clinic' },
  ]

  const rowActions: RowAction<FormattedStaff>[] = [
    {
      icon: <Ban className="w-4 h-4" />,
      onClick: onDisable,
      className: 'p-1.5 text-red-600 hover:bg-red-50 rounded transition',
      title: 'Disable Account',
      hidden: (m) => m.isDisabled,
    },
    {
      icon: <UserCheck className="w-4 h-4" />,
      onClick: onEnable,
      className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition',
      title: 'Enable Account',
      hidden: (m) => !m.isDisabled,
    },
  ]

  return (
    <DataTable<FormattedStaff>
      data={staff}
      columns={columns}
      getRowKey={(member) => member.userId}
      onEdit={onEdit}
      rowActions={rowActions}
      rowClassName={(m) => m.isDisabled ? 'opacity-60 bg-gray-50' : ''}
      currentPage={currentPage}
      totalCount={totalCount}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      onRefresh={onRefresh}
      emptyMessage="No staff members found. Add one to get started."
    />
  )
}
