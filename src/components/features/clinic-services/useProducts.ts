import { useState, useTransition } from 'react'
import { addProduct, addProductToAllBranches, updateProduct, deleteProduct } from '@/actions/serviceActions'
import { Product } from '@/components/features/clinic-services/types'
import { EMPTY_PRODUCT_FORM } from '@/components/features/clinic-services/constants'

interface UseProductsProps {
  clinicId: number
  initialProducts: Product[]
  allClinicIds?: number[]
}

export const useProducts = ({ clinicId, initialProducts, allClinicIds = [] }: UseProductsProps) => {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_PRODUCT_FORM)
    setShowForm(true)
    setMsg(null)
  }

  const openEdit = (p: Product) => {
    const isRange =
      p.price_min != null && p.price_max != null && p.price_min !== p.price_max
    setEditingId(p.id)
    setForm({
      name: p.name,
      price: String(p.price),
      price_type: isRange ? 'range' : 'fixed',
      price_min: p.price_min != null ? String(p.price_min) : String(p.price),
      price_max: p.price_max != null ? String(p.price_max) : String(p.price),
      addToAllBranches: false,
    })
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
      const isRange = form.price_type === 'range'
      const price = isRange ? Number(form.price_min) : Number(form.price)
      const payload = {
        clinic_id: clinicId,
        name: form.name.trim(),
        price,
        price_min: isRange ? Number(form.price_min) : null,
        price_max: isRange ? Number(form.price_max) : null,
      }

      let result
      if (editingId) {
        result = await updateProduct(editingId, payload)
      } else if (form.addToAllBranches && allClinicIds.length > 0) {
        const { name, price, price_min, price_max } = payload
        result = await addProductToAllBranches({ name, price, price_min, price_max }, allClinicIds)
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
        setMsg({ type: 'success', text: 'Product updated.' })
      } else if (form.addToAllBranches) {
        setMsg({ type: 'success', text: 'Product added to all branches.' })
      } else {
        const newProduct = (result as { success: true; product: Product }).product
        if (newProduct) {
          setProducts(prev => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)))
        }
        setMsg({ type: 'success', text: 'Product added.' })
      }
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
