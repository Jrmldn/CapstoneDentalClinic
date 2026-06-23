'use client'

import { useState, useMemo } from 'react'
import { Plus, Tag, ArrowUpDown, PackageX, PackageCheck, Clock, ShieldAlert, AlertTriangle } from 'lucide-react'
import type { RowAction } from '@/components/common/DataTable'
import { fetchInventory, fetchCategories, deleteInventoryItem } from '@/actions/inventoryActions'
import { getInventoryStatus, getInventoryStatuses, summarizeInventory, isExpired, isExpiringSoon, isStockLow } from '@/utils/inventory-helpers'
import { formatDate } from '@/lib/date'
import DataTable, { type ColumnDef } from '@/components/common/DataTable'
import AddInventoryModal from '@/components/features/inventory/AddInventoryModal'
import EditInventoryModal from '@/components/features/inventory/EditInventoryModal'
import UpdateStockModal from '@/components/features/inventory/UpdateStockModal'
import ManageCategoriesModal from '@/components/features/inventory/ManageCategoriesModal'
import InventoryFilterBar from '@/components/features/inventory/InventoryFilterBar'
import type { InventoryItem, InventoryCategory, InventoryStatus } from './types'

const ITEMS_PER_PAGE = 10

interface InventoryClientProps {
  clinicId: number
  initialItems: InventoryItem[]
  initialCategories: InventoryCategory[]
  userId: string
}

function getStatusBadge(status: InventoryStatus) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide'
  if (status === 'expired') return `${base} bg-red-100 text-red-700`
  if (status === 'expiring_soon') return `${base} bg-amber-100 text-amber-700`
  if (status === 'out_of_stock') return `${base} bg-gray-100 text-gray-600`
  if (status === 'low_stock') return `${base} bg-orange-100 text-orange-700`
  return `${base} bg-green-100 text-green-700`
}

function getStatusLabel(status: InventoryStatus) {
  if (status === 'expired') return 'Expired'
  if (status === 'expiring_soon') return 'Exp. Soon'
  if (status === 'out_of_stock') return 'Out of Stock'
  if (status === 'low_stock') return 'Low Stock'
  return 'Normal'
}

function getRowClass(item: InventoryItem) {
  const status = getInventoryStatus(item)
  if (status === 'expired') return 'bg-red-50/40'
  if (status === 'expiring_soon') return 'bg-amber-50/40'
  return ''
}

export default function InventoryClient({ clinicId, initialItems, initialCategories, userId }: InventoryClientProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [categories, setCategories] = useState<InventoryCategory[]>(initialCategories)

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [expiryFilter, setExpiryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [updatingItem, setUpdatingItem] = useState<InventoryItem | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  const refreshInventory = async () => {
    const [invRes, catRes] = await Promise.all([
      fetchInventory(clinicId),
      fetchCategories(clinicId),
    ])
    if (invRes.success) setItems(invRes.items as InventoryItem[])
    if (catRes.success) setCategories(catRes.categories as InventoryCategory[])
  }

  const summary = useMemo(() => summarizeInventory(items), [items])

  const filteredItems = useMemo(() => {
    const lower = searchTerm.toLowerCase()
    return items.filter(item => {
      if (lower && !item.name.toLowerCase().includes(lower)) return false
      if (categoryFilter && String(item.category_id) !== categoryFilter) return false

      if (expiryFilter) {
        const expired = isExpired(item.expiry_date)
        const soon = isExpiringSoon(item.expiry_date)
        if (expiryFilter === 'expired' && !expired) return false
        if (expiryFilter === 'expiring_soon' && (expired || !soon)) return false
        if (expiryFilter === 'not_expired' && (expired || soon)) return false
      }

      if (stockFilter) {
        const qty = Number(item.quantity)
        const low = isStockLow(qty, Number(item.alert_threshold))
        if (stockFilter === 'out_of_stock' && qty !== 0) return false
        if (stockFilter === 'low_stock' && !low) return false
        if (stockFilter === 'normal' && (qty === 0 || low)) return false
      }

      return true
    })
  }, [items, searchTerm, categoryFilter, expiryFilter, stockFilter])

  function handleFilterChange(setter: (v: string) => void) {
    return (value: string) => {
      setter(value)
      setCurrentPage(1)
    }
  }

  const pageItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleDelete = async (item: InventoryItem) => {
    await deleteInventoryItem(item.id)
    await refreshInventory()
  }

  const rowActions: RowAction<InventoryItem>[] = [
    {
      icon: <ArrowUpDown className="w-4 h-4" />,
      onClick: setUpdatingItem,
      className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition',
      title: 'Update Stock',
    },
  ]

  const columns: ColumnDef<InventoryItem>[] = [
    {
      key: 'name',
      label: 'Product',
      render: (value) => <span className="font-semibold text-slate-800">{value as string}</span>,
    },
    {
      key: 'inventory_categories',
      label: 'Category',
      render: (value) => {
        const cat = value as InventoryCategory | null | undefined
        if (!cat) return <span className="text-gray-400 text-xs">—</span>
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-semibold">
            <Tag className="w-2.5 h-2.5" />
            {cat.name}
          </span>
        )
      },
    },
    {
      key: 'quantity',
      label: 'Current Stock',
      render: (value, item) => (
        <span className={`font-bold ${Number(value) === 0 ? 'text-gray-400' : 'text-slate-700'}`}>
          {Number(value)} {item.unit}
        </span>
      ),
    },
    {
      key: 'expiry_date',
      label: 'Expiry Date',
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-xs">—</span>
        const dateStr = value as string
        const expired = isExpired(dateStr)
        const soon = isExpiringSoon(dateStr)
        return (
          <span className={`text-sm font-medium ${expired ? 'text-red-600' : soon ? 'text-amber-600' : 'text-slate-600'}`}>
            {formatDate(dateStr)}
          </span>
        )
      },
    },
    {
      key: 'id',
      label: 'Status',
      render: (_, item) => {
        const statuses = getInventoryStatuses(item)
        return (
          <div className="flex flex-wrap gap-1">
            {statuses.map(s => (
              <span key={s} className={getStatusBadge(s)}>{getStatusLabel(s)}</span>
            ))}
          </div>
        )
      },
    },
  ]

  const summaryCards = [
    {
      label: 'Expired',
      count: summary.expired,
      description: 'Items past their expiry date',
      Icon: PackageX,
      bg: 'bg-red-50',
      border: 'border-red-200',
      countColor: 'text-red-700',
      iconColor: 'text-red-400',
      descColor: 'text-red-500',
    },
    {
      label: 'Expiring Soon',
      count: summary.expiringSoon,
      description: 'Expire within the next 30 days',
      Icon: Clock,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      countColor: 'text-amber-700',
      iconColor: 'text-amber-400',
      descColor: 'text-amber-500',
    },
    {
      label: 'Out of Stock',
      count: summary.outOfStock,
      description: 'Zero quantity remaining',
      Icon: ShieldAlert,
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      countColor: 'text-gray-700',
      iconColor: 'text-gray-400',
      descColor: 'text-gray-500',
    },
    {
      label: 'Low Stock',
      count: summary.lowStock,
      description: 'At or below alert threshold',
      Icon: AlertTriangle,
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      countColor: 'text-orange-700',
      iconColor: 'text-orange-400',
      descColor: 'text-orange-500',
    },
    {
      label: 'Normal',
      count: summary.normal,
      description: 'Items in good standing',
      Icon: PackageCheck,
      bg: 'bg-green-50',
      border: 'border-green-200',
      countColor: 'text-green-700',
      iconColor: 'text-green-400',
      descColor: 'text-green-500',
    },
  ]

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryCards.map(card => (
          <div key={card.label} className={`rounded-xl p-4 border ${card.bg} ${card.border}`}>
            <div className="flex items-start justify-between mb-3">
              <span className={`text-3xl font-black ${card.countColor}`}>{card.count}</span>
              <div className={`p-1.5 rounded-lg bg-white/60`}>
                <card.Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className={`text-sm font-bold ${card.countColor}`}>{card.label}</p>
            <p className={`text-[11px] mt-0.5 leading-snug ${card.descColor}`}>{card.description}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <InventoryFilterBar
          items={items}
          categories={categories}
          searchTerm={searchTerm}
          onSearchChange={handleFilterChange(setSearchTerm)}
          categoryFilter={categoryFilter}
          onCategoryChange={handleFilterChange(setCategoryFilter)}
          expiryFilter={expiryFilter}
          onExpiryChange={handleFilterChange(setExpiryFilter)}
          stockFilter={stockFilter}
          onStockChange={handleFilterChange(setStockFilter)}
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            <Tag className="w-4 h-4" />
            Manage Categories
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable<InventoryItem>
        data={pageItems}
        columns={columns}
        getRowKey={item => item.id}
        currentPage={currentPage}
        totalCount={filteredItems.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        rowActions={rowActions}
        onEdit={setEditingItem}
        onDelete={handleDelete}
        rowClassName={getRowClass}
        emptyMessage="No inventory items match your filters."
        onRefresh={refreshInventory}
      />

      {/* Modals */}
      <AddInventoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={refreshInventory}
        clinicId={clinicId}
        categories={categories}
      />

      <EditInventoryModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={refreshInventory}
        categories={categories}
      />

      <UpdateStockModal
        item={updatingItem}
        isOpen={!!updatingItem}
        onClose={() => setUpdatingItem(null)}
        onSuccess={refreshInventory}
        userId={userId}
      />

      <ManageCategoriesModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={refreshInventory}
        clinicId={clinicId}
        categories={categories}
      />
    </div>
  )
}
