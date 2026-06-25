'use client'

import DataTable, { type ColumnDef, type RowAction } from '@/components/common/DataTable'
import { Ban, UserCheck } from 'lucide-react'
import { FormattedDentist } from '@/types/clinic'

interface DentistTableProps {
  dentists: FormattedDentist[]
  onRefresh?: () => void
  onEdit: (dentist: FormattedDentist) => void
  onDisable: (dentist: FormattedDentist) => void
  onEnable: (dentist: FormattedDentist) => void | Promise<void>
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function DentistTable({
  dentists,
  onRefresh,
  onEdit,
  onDisable,
  onEnable,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
}: DentistTableProps) {
  const columns: ColumnDef<FormattedDentist>[] = [
    {
      key: 'firstName',
      label: 'Name',
      render: (_, dentist) => (
        <span className="flex items-center gap-2">
          {`Dr. ${dentist.firstName} ${dentist.lastName}`}
          {dentist.isDisabled && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
              Disabled
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'specialty',
      label: 'Specialty',
      render: (specialty) => specialty || 'General Dentistry',
    },
    { key: 'email', label: 'Email' },
    { key: 'clinicName', label: 'Clinic' },
  ]

  const rowActions: RowAction<FormattedDentist>[] = [
    {
      icon: <Ban className="w-4 h-4" />,
      onClick: onDisable,
      className: 'p-1.5 text-red-600 hover:bg-red-50 rounded transition',
      title: 'Disable Account',
      hidden: (d) => d.isDisabled,
    },
    {
      icon: <UserCheck className="w-4 h-4" />,
      onClick: onEnable,
      className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition',
      title: 'Enable Account',
      hidden: (d) => !d.isDisabled,
    },
  ]

  return (
    <DataTable<FormattedDentist>
      data={dentists}
      columns={columns}
      getRowKey={(dentist) => dentist.userId}
      onEdit={onEdit}
      rowActions={rowActions}
      rowClassName={(d) => d.isDisabled ? 'opacity-60 bg-gray-50' : ''}
      currentPage={currentPage}
      totalCount={totalCount}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      onRefresh={onRefresh}
      emptyMessage="No dentists found. Add one to get started."
    />
  )
}
