'use client'

import { useState } from 'react'
import { Plus, Package, Search, AlertTriangle, History, ArrowUpDown } from 'lucide-react'
import { fetchInventory } from '@/actions/managementActions'
import AddInventoryModal from './AddInventoryModal'
import UpdateStockModal from './UpdateStockModal'
import InventoryLogsModal from './InventoryLogsModal'

export interface InventoryItem {
  id: number
  name: string
  unit: string
  quantity: number
  alert_threshold: number
  updated_at: string
}

interface InventoryClientProps {
  clinicId: number
  initialItems: InventoryItem[]
  userId: string
}

export default function InventoryClient({ clinicId, initialItems, userId }: InventoryClientProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [updatingItem, setUpdatingItem] = useState<InventoryItem | null>(null)
  const [loggingItem, setLoggingItem] = useState<InventoryItem | null>(null)

  const refreshInventory = async () => {
    const res = await fetchInventory(clinicId)
    if (res.success) setItems(res.items as InventoryItem[])
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockCount = items.filter(i => Number(i.quantity) <= Number(i.alert_threshold)).length

  return (
    <div className="space-y-6">
      {/* Alert Banner for Low Stock */}
      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4 text-red-800 animate-in fade-in slide-in-from-top-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-sm">Low Stock Alert</p>
            <p className="text-xs text-red-700/80">
              There are {lowStockCount} items currently at or below their alert threshold.
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search supplies..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const isLow = Number(item.quantity) <= Number(item.alert_threshold)
          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border ${isLow ? 'border-red-200 shadow-red-50/50' : 'border-gray-100'} shadow-sm p-5 hover:shadow-md transition-all group relative overflow-hidden`}
            >
              {isLow && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rotate-45 translate-x-8 -translate-y-8" />}
              
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${isLow ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Package className="w-5 h-5" />
                </div>
                {isLow && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    Low Stock
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition">
                  {item.name}
                </h3>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                    {Number(item.quantity)}
                  </span>
                  <span className="text-xs font-medium text-gray-500">{item.unit}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  Min. Threshold: {item.alert_threshold} {item.unit}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex gap-2">
                <button
                  onClick={() => setUpdatingItem(item)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-600 hover:text-white transition"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Update Stock
                </button>
                <button
                  onClick={() => setLoggingItem(item)}
                  className="px-3 flex items-center justify-center bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition"
                  title="View History"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-500 font-medium">No items found</h3>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or add a new item.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddInventoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={refreshInventory}
        clinicId={clinicId}
      />

      <UpdateStockModal
        item={updatingItem}
        isOpen={!!updatingItem}
        onClose={() => setUpdatingItem(null)}
        onSuccess={refreshInventory}
        userId={userId}
      />

      <InventoryLogsModal
        item={loggingItem}
        isOpen={!!loggingItem}
        onClose={() => setLoggingItem(null)}
      />
    </div>
  )
}
