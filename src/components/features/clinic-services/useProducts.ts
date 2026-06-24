import { useState, useTransition } from 'react'
import { addProduct, updateProduct, deleteProduct } from '@/actions/serviceActions'
import { Product } from '@/components/features/clinic-services/types'
import { EMPTY_PRODUCT_FORM } from '@/components/features/clinic-services/constants'



interface UseProductsProps {
  clinicId: number
  initialProducts: Product[]
}

/**
 * Custom Hook: useProducts
 * Manages form state, products list updates (including optimistic sorting), 
 * messages, and server actions transitions for the products view.
 */
export const useProducts = ({ clinicId, initialProducts }: UseProductsProps) => {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_PRODUCT_FORM)
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
    setForm(EMPTY_PRODUCT_FORM)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const payload = {
        clinic_id: clinicId,
        name: form.name.trim(),
        price: Number(form.price),
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
        setProducts(prev =>
          prev.map(p => (p.id === editingId ? { ...p, ...payload } : p))
        )
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

  return {
    products,
    showForm,
    editingId,
    form,
    msg,
    isPending,
    handleChange,
    openAdd,
    openEdit,
    handleCancel,
    handleSubmit,
    handleDelete,
  }
}
