import { useState, useTransition } from 'react'
import { addService, updateService, deleteService } from '@/actions/serviceActions'
import { Service } from '@/components/features/clinic-services/types'
import { EMPTY_FORM } from '@/components/features/clinic-services/constants'



interface UseServicesProps {
  clinicId: number
  initialServices: Service[]
}

/**
 * Custom Hook: useServices
 * Manages form state, services list updates (including optimistic sorting), 
 * messages, and server actions transitions for the services view.
 */
export const useServices = ({ clinicId, initialServices }: UseServicesProps) => {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setMsg(null)
  }

  const openEdit = (s: Service) => {
    setEditingId(s.id)
    setForm({ name: s.name, price: String(s.price), slot_duration_min: String(s.slot_duration_min) })
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
        name: form.name.trim(),
        price: Number(form.price),
        slot_duration_min: Number(form.slot_duration_min),
      }

      let result
      if (editingId) {
        result = await updateService(editingId, payload)
      } else {
        result = await addService(payload)
      }

      if (!result.success) {
        setMsg({ type: 'error', text: result.error ?? 'Something went wrong.' })
        return
      }

      // Optimistic update
      if (editingId) {
        setServices(prev =>
          prev.map(s => (s.id === editingId ? { ...s, ...payload } : s))
        )
      } else {
        const newService = (result as { success: true; service: Service }).service
        setServices(prev => [...prev, newService].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setMsg({ type: 'success', text: editingId ? 'Service updated.' : 'Service added.' })
      handleCancel()
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm('Archive this service? It will no longer appear in bookings.')) return
    startTransition(async () => {
      const result = await deleteService(id)
      if (result.success) {
        setServices(prev => prev.filter(s => s.id !== id))
      } else {
        setMsg({ type: 'error', text: result.error ?? 'Failed to delete.' })
      }
    })
  }

  return {
    services,
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
