'use client'

import { CheckCircle2, AlertCircle, Pencil, Ban, UserCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DataTable, { type ColumnDef, type RowAction } from '@/components/common/DataTable'
import { Clinic } from '@/types/clinic'

interface ClinicTableProps {
  clinics: Clinic[]
  onRefresh?: () => void
  onDisable: (clinic: Clinic) => void
  onEnable: (clinic: Clinic) => void
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

const getStatusBadge = (isActive: boolean) =>
  isActive ? (
    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
      <CheckCircle2 className="w-3 h-3" />
      Active
    </div>
  ) : (
    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
      <AlertCircle className="w-3 h-3" />
      Inactive
    </div>
  )

const columns: ColumnDef<Clinic>[] = [
  { key: 'name', label: 'CLINIC NAME' },
  {
    key: 'is_active',
    label: 'STATUS',
    render: (isActive) => getStatusBadge(isActive ?? false),
  },
  { key: 'email', label: 'EMAIL' },
  { key: 'phone', label: 'PHONE NUMBER' },
]

export default function ClinicTable({
  clinics,
  onRefresh,
  onDisable,
  onEnable,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
}: ClinicTableProps) {
  const router = useRouter()

  const rowActions: RowAction<Clinic>[] = [
    {
      icon: <Pencil className="w-4 h-4" />,
      onClick: (clinic) => router.push(`/superadmin-dashboard/clinic/${clinic.id}/profile`),
      className: 'p-1.5 text-blue-600 hover:bg-blue-50 rounded transition',
      title: 'Manage Profile',
    },
    {
      icon: <Ban className="w-4 h-4" />,
      onClick: onDisable,
      className: 'p-1.5 text-red-600 hover:bg-red-50 rounded transition',
      title: 'Disable Clinic',
      hidden: (c) => !c.is_active,
    },
    {
      icon: <UserCheck className="w-4 h-4" />,
      onClick: onEnable,
      className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition',
      title: 'Enable Clinic',
      hidden: (c) => c.is_active === true,
    },
  ]

  return (
    <DataTable<Clinic>
      data={clinics}
      columns={columns}
      getRowKey={(clinic) => clinic.id}
      rowActions={rowActions}
      currentPage={currentPage}
      totalCount={totalCount}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      onRefresh={onRefresh}
      emptyMessage="No clinics found. Add a new clinic to get started."
    />
  )
}
