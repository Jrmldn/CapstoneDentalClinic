'use client'

import { Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'

export type ColumnDef<T> = {
  [K in keyof T]: {
    key: K
    label: string
    render?: (value: T[K], item: T) => React.ReactNode
    width?: string
    align?: 'left' | 'right' | 'center'
  }
}[keyof T]

export type RowAction<T> = {
  icon: React.ReactNode
  onClick: (item: T) => void | Promise<void>
  className?: string
  title?: string
  disabled?: boolean
  isLoading?: (item: T) => boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  getRowKey: (item: T) => string | number
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void | Promise<void> | unknown
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onRefresh?: () => void
  emptyMessage?: string
  rowClassName?: (item: T) => string
  selectableRows?: boolean
}

export default function DataTable<T extends object>({
  data,
  columns,
  getRowKey,
  onEdit,
  onDelete,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  onRefresh,
  emptyMessage = 'No data found.',
  rowClassName,
  selectableRows = false,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([])
  const [deletingId, setDeletingId] = useState<string | number | null>(null)

  const toggleRowSelection = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const allIds = data.map((item) => getRowKey(item))
    const allVisibleSelected = data.length > 0 && data.every((item) => selectedIds.includes(getRowKey(item)))

    if (allVisibleSelected) {
      const visibleIds = data.map((item) => getRowKey(item))
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    } else {
      const newIds = allIds.filter((id) => !selectedIds.includes(id))
      setSelectedIds((prev) => [...prev, ...newIds])
    }
  }

  const handleDelete = async (item: T) => {
    const id = getRowKey(item)
    if (confirm('Are you sure you want to delete this item?')) {
      setDeletingId(id)
      try {
        await onDelete?.(item)
        setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id))
        onRefresh?.()
      } finally {
        setDeletingId(null)
      }
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const isAllVisibleSelected =
    data.length > 0 && data.every((item) => selectedIds.includes(getRowKey(item)))

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {selectableRows && (
                <th className="px-6 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    className="rounded cursor-pointer w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={isAllVisibleSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-6 py-3 text-${col.align || 'left'} text-xs font-semibold text-gray-600 uppercase tracking-wider ${col.width || ''}`}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ACTIONS
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => {
              const id = getRowKey(item)
              const isSelected = selectedIds.includes(id)
              const customRowClass = rowClassName?.(item) || ''

              return (
                <tr
                  key={id}
                  className={`transition ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'} ${customRowClass}`}
                >
                  {selectableRows && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded cursor-pointer w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(id)}
                      />
                    </td>
                  )}
                  {columns.map((col) => {
                    const value = item[col.key]
                    const rendered = col.render ? col.render(value, item) : (value as React.ReactNode)

                    return (
                      <td
                        key={String(col.key)}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-${col.align || 'left'}`}
                      >
                        {rendered}
                      </td>
                    )
                  })}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            disabled={deletingId === id}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>Showing {data.length} of {totalCount}</span>
          {selectableRows && selectedIds.length > 0 && (
            <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
          >
            &lt;
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-2 py-1 hover:bg-gray-200 rounded transition ${
                currentPage === page ? 'text-blue-600 font-medium' : ''
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  )
}
