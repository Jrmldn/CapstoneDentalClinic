'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react'
import { addProduct, updateProduct, deleteProduct } from '@/actions/serviceActions'

interface Product {
  id: number
  name: string
  price: number
  is_active: boolean
}

interface Props {
  clinicId: number
  initialProducts: Product[]
}

const EMPTY_FORM = { name: '', price: '' }

export default function ProductsTable({ clinicId, initialProducts }: Props) {
  const [products, setProducts]     = useState<Product[]>(initialProducts)
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [msg, setMsg]               = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setMsg(null)
  }

  const openEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({ name: p.name, price: String(p.price) })
    setShowForm(true)
    setMsg(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const payload = {
        clinic_id: clinicId,
        name:      form.name.trim(),
        price:     Number(form.price),
      }

      let result
      if (editingId) {
        result = await updateProduct(editingId, payload)
      } else {
        result = await addProduct(payload)
      }

      if (!result.success) {
        setMsg({ type: 'error', text: result.error ?? 'Something went wrong.' })
        return
      }

      if (editingId) {
        setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...payload } : p))
      } else {
        const newProduct = (result as { success: true; product: Product }).product
        setProducts(prev => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setMsg({ type: 'success', text: editingId ? 'Product updated.' : 'Product added.' })
      handleCancel()
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm('Archive this product? It will no longer appear in billing.')) return
    startTransition(async () => {
      const result = await deleteProduct(id)
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== id))
      } else {
        setMsg({ type: 'error', text: result.error ?? 'Failed to delete.' })
      }
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{products.length} active product{products.length !== 1 ? 's' : ''}</p>
        <button
          id="add-product-btn"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 p-4 rounded-xl border border-blue-100 bg-blue-50 space-y-3"
        >
          <p className="text-sm font-semibold text-slate-700">
            {editingId ? 'Edit Product' : 'New Product'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
              <input
                id="product-name-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Dental Floss"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price (₱)</label>
              <input
                id="product-price-input"
                name="price"
                type="number"
                min="0"
                step="10"
                value={form.price}
                onChange={handleChange}
                required
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {msg && (
            <p className={`text-xs font-medium ${msg.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {msg.text}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </form>
      )}

      {/* Global error outside form */}
      {msg && !showForm && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Table */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No products yet. Click &quot;Add Product&quot; to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Product Name</th>
                <th className="px-5 py-3 text-left font-medium">Price</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-700">{p.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">₱{Number(p.price).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                        title="Archive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
