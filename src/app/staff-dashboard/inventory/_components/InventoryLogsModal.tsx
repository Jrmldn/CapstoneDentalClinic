'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, User, Info, TrendingUp, TrendingDown } from 'lucide-react'
import { fetchInventoryLogs } from '@/actions/managementActions'
import type { InventoryItem } from './InventoryClient'

interface InventoryLogsModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
}

interface Log {
  id: number
  delta: number
  reason: string
  performer_name: string
  created_at: string
}

export default function InventoryLogsModal({ item, isOpen, onClose }: InventoryLogsModalProps) {
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && item) {
      const loadLogs = async () => {
        setIsLoading(true)
        try {
          const res = await fetchInventoryLogs(item.id)
          if (res.success) setLogs(res.logs as Log[])
        } catch (err) {
          console.error("Failed to load logs:", err)
        } finally {
          setIsLoading(false)
        }
      }
      loadLogs()
    }
  }, [isOpen, item])

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 h-[600px] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Inventory History</h2>
            <p className="text-xs text-gray-500 mt-1">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-900 transition p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm">Loading history...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Info className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">No history logs found for this item.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {logs.map((log) => {
                const isPositive = Number(log.delta) > 0
                return (
                  <div key={log.id} className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-[-24px] before:w-[2px] before:bg-gray-100 last:before:hidden">
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                      isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`text-sm font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isPositive ? '+' : ''}{Number(log.delta)} {item.unit}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500 font-semibold">
                            <User className="w-3 h-3" />
                            {log.performer_name}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                          <Calendar className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleDateString()} · {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        &quot;{log.reason || 'No reason provided'}&quot;
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-gray-100 transition shadow-sm"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  )
}
