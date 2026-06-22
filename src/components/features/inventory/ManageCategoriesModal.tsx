'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Pencil, Trash2, Check, Layers } from 'lucide-react'
import { addCategory, editCategory, removeCategory } from '@/actions/inventoryActions'
import type { InventoryCategory } from './types'

interface ManageCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clinicId: number
  categories: InventoryCategory[]
}

function friendlyError(raw: string | undefined): string {
  if (!raw) return 'Something went wrong'
  if (raw.includes('duplicate key') || raw.includes('unique constraint') || raw.includes('already exists')) {
    return 'A category with that name already exists'
  }
  return raw
}

export default function ManageCategoriesModal({
  isOpen,
  onClose,
  onSuccess,
  clinicId,
  categories: initialCategories,
}: ManageCategoriesModalProps) {
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState<InventoryCategory[]>(initialCategories)
  const [mode, setMode] = useState<'single' | 'bulk'>('single')

  // single add
  const [newName, setNewName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // bulk add
  const [bulkText, setBulkText] = useState('')
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ added: string[]; skipped: string[] } | null>(null)

  // edit / delete
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  if (!mounted || !isOpen) return null

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setIsAdding(true)
    setError('')
    const result = await addCategory(clinicId, newName.trim())
    if (result.success && result.category) {
      setCategories(prev =>
        [...prev, result.category as InventoryCategory].sort((a, b) => a.name.localeCompare(b.name))
      )
      setNewName('')
      onSuccess()
    } else {
      setError(friendlyError(result.error))
    }
    setIsAdding(false)
  }

  async function handleBulkAdd(e: React.FormEvent) {
    e.preventDefault()
    const names = bulkText
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
    if (!names.length) return

    setIsBulkAdding(true)
    setError('')
    setBulkResult(null)

    const added: string[] = []
    const skipped: string[] = []

    for (const name of names) {
      const result = await addCategory(clinicId, name)
      if (result.success && result.category) {
        added.push(name)
        setCategories(prev =>
          [...prev, result.category as InventoryCategory].sort((a, b) => a.name.localeCompare(b.name))
        )
      } else {
        skipped.push(name)
      }
    }

    if (added.length) onSuccess()
    setBulkText('')
    setBulkResult({ added, skipped })
    setIsBulkAdding(false)
  }

  async function handleEdit(id: number) {
    if (!editingName.trim()) return
    setError('')
    const result = await editCategory(id, editingName.trim())
    if (result.success) {
      setCategories(prev =>
        prev.map(c => c.id === id ? { ...c, name: editingName.trim() } : c)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditingId(null)
      setEditingName('')
      onSuccess()
    } else {
      setError(friendlyError(result.error))
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    const result = await removeCategory(id)
    if (result.success) {
      setCategories(prev => prev.filter(c => c.id !== id))
      onSuccess()
    } else {
      setError(friendlyError(result.error))
    }
    setDeletingId(null)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900">Manage Categories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-900 transition p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium">{error}</div>}

          {/* Mode toggle */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('single'); setBulkResult(null) }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'single' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Plus className="w-3.5 h-3.5" />
              Single
            </button>
            <button
              type="button"
              onClick={() => { setMode('bulk'); setBulkResult(null) }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'bulk' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              Bulk Add
            </button>
          </div>

          {mode === 'single' ? (
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                placeholder="New category name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isAdding || !newName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </form>
          ) : (
            <form onSubmit={handleBulkAdd} className="space-y-2">
              <textarea
                placeholder={'Enter category names, one per line or comma-separated:\nConsumables\nAnesthetics\nSurgical Tools'}
                value={bulkText}
                onChange={e => { setBulkText(e.target.value); setBulkResult(null) }}
                rows={4}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              />
              <button
                type="submit"
                disabled={isBulkAdding || !bulkText.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
              >
                <Layers className="w-4 h-4" />
                {isBulkAdding ? 'Adding...' : 'Add All'}
              </button>
              {bulkResult && (
                <div className="text-xs space-y-1 pt-1">
                  {bulkResult.added.length > 0 && (
                    <p className="text-green-600 font-medium">
                      ✓ Added: {bulkResult.added.join(', ')}
                    </p>
                  )}
                  {bulkResult.skipped.length > 0 && (
                    <p className="text-amber-600 font-medium">
                      ⚠ Already exists: {bulkResult.skipped.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </form>
          )}

          {/* Category list */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No categories yet. Add one above.</p>
            )}
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                {editingId === cat.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditingId(null) }}
                      className="flex-1 px-2 py-1 bg-white border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={() => handleEdit(cat.id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-slate-700">{cat.name}</span>
                    <button
                      onClick={() => { setEditingId(cat.id); setEditingName(cat.name); setError('') }}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      title="Rename"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === cat.id
                        ? <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-gray-100 transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
