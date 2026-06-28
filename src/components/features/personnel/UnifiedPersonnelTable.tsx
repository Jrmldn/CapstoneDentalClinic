'use client'

import { Ban, UserCheck, CalendarDays } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DataTable, { ColumnDef, RowAction } from '@/components/common/DataTable'
import { UnifiedPersonnel } from '@/types/clinic'

interface UnifiedPersonnelTableProps {
  data: UnifiedPersonnel[]
  onEdit: (p: UnifiedPersonnel) => void
  onDisable: (p: UnifiedPersonnel) => void
  onEnable: (p: UnifiedPersonnel) => void
  onRefresh?: () => void
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

const columns: ColumnDef<UnifiedPersonnel>[] = [
  {
    key: 'firstName',
    label: 'Name',
    render: (_: string, p: UnifiedPersonnel) => `${p.firstName} ${p.lastName}`,
  },
  {
    key: 'role',
    label: 'Role',
    render: (role: 'staff' | 'dentist') =>
      role === 'staff' ? (
        <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
          Staff
        </span>
      ) : (
        <span className="px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-full">
          Dentist
        </span>
      ),
  },
  {
    key: 'email',
    label: 'Email',
  },
  {
    key: 'clinicName',
    label: 'Clinic',
  },
  {
    key: 'isDisabled',
    label: 'Status',
    render: (isDisabled: boolean) =>
      isDisabled ? (
        <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded-full">
          Inactive
        </span>
      ) : (
        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">
          Active
        </span>
      ),
  },
]

export default function UnifiedPersonnelTable({
  data,
  onEdit,
  onDisable,
  onEnable,
  onRefresh,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
}: UnifiedPersonnelTableProps) {
  const router = useRouter()

  const rowActions: RowAction<UnifiedPersonnel>[] = [
    {
      icon: <CalendarDays className="w-4 h-4" />,
      onClick: (p) => router.push(`/superadmin-dashboard/personnel/dentist/${p.userId}/schedule`),
      className: 'p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition',
      title: 'View Schedule',
      hidden: (p) => p.role !== 'dentist',
    },
    {
      icon: <Ban className="w-4 h-4" />,
      onClick: onDisable,
      className: 'p-1.5 text-red-600 hover:bg-red-50 rounded transition',
      title: 'Disable Account',
      hidden: (p) => p.isDisabled,
    },
    {
      icon: <UserCheck className="w-4 h-4" />,
      onClick: onEnable,
      className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition',
      title: 'Enable Account',
      hidden: (p) => !p.isDisabled,
    },
  ]

  return (
    <DataTable<UnifiedPersonnel>
      data={data}
      columns={columns}
      getRowKey={(p) => p.userId}
      onEdit={onEdit}
      rowActions={rowActions}
      rowClassName={() => ''}
      onRefresh={onRefresh}
      currentPage={currentPage}
      totalCount={totalCount}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      emptyMessage="No personnel found."
    />
  )
}
