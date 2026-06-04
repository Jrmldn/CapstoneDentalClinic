'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'
import DataTable, { type ColumnDef } from '@/components/common/DataTable'
import { deleteClinic, updateClinicStatus } from '@/actions/clinicActions'

interface Clinic {
  id: number
  name: string
  is_active: boolean
  email: string
  phone: string
  address: string
  max_appointments_per_day: number
  latitude?: number | null
  longitude?: number | null
}

interface ClinicTableProps {
  clinics: Clinic[]
  onRefresh?: () => void
  onEdit?: (clinic: Clinic) => void
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

const getStatusBadge = (isActive: boolean) => {
  return isActive ? (
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
}

const getLocationCell = (lat?: number | null, lng?: number | null) => {
  if (!lat || !lng) {
    return (
      <span className="text-xs text-gray-400 italic">Not set</span>
    )
  }
  return (
    <span className="text-xs text-gray-600 font-mono">
      {lat.toFixed(4)}, {lng.toFixed(4)}
    </span>
  )
}

export default function ClinicTable({
  clinics,
  onRefresh,
  onEdit,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
}: ClinicTableProps) {
  const handleStatusToggle = async (clinic: Clinic) => {
    const result = await updateClinicStatus(clinic.id, !clinic.is_active)
    if (result.success) {
      onRefresh?.()
    } else {
      alert('Error updating clinic status: ' + result.error)
    }
  }

  const columns: ColumnDef<Clinic>[] = [
    { key: 'name', label: 'CLINIC NAME' },
    {
      key: 'is_active',
      label: 'STATUS',
      render: (isActive, clinic) => (
        <button
          onClick={() => handleStatusToggle(clinic)}
          className="hover:opacity-70 transition"
        >
          {getStatusBadge(isActive)}
        </button>
      ),
    },
    { key: 'email', label: 'EMAIL' },
    { key: 'phone', label: 'PHONE NUMBER' },
    {
      key: 'address',
      label: 'ADDRESS',
      render: (address) => (
        <span className="truncate max-w-[200px] block">{address}</span>
      ),
    },
    {
      key: 'latitude',
      label: 'LOCATION',
      render: (_, clinic) => getLocationCell(clinic.latitude, clinic.longitude),
    },
    { key: 'max_appointments_per_day', label: 'CAPACITY' },
  ]

  return (
    <DataTable<Clinic>
      data={clinics}
      columns={columns}
      getRowKey={(clinic) => clinic.id}
      onEdit={onEdit}
      onDelete={(clinic) => deleteClinic(clinic.id)}
      currentPage={currentPage}
      totalCount={totalCount}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      onRefresh={onRefresh}
      emptyMessage="No clinics found. Add a new clinic to get started."
      selectableRows={true}
    />
  )
}