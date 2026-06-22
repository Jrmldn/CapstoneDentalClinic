import { useState, useTransition } from 'react'
import { addService, addServiceToAllBranches, updateService, deleteService } from '@/actions/serviceActions'
import { Service } from '@/components/features/clinic-services/types'
import { EMPTY_FORM } from '@/components/features/clinic-services/constants'

interface UseServicesProps {
  clinicId: number
  initialServices: Service[]
  allClinicIds?: number[]
}

export const useServices = ({ clinicId, initialServices, allClinicIds = [] }: UseServicesProps) => {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setMsg(null)
  }

  const openEdit = (s: Service) => {
    const isRange =
      s.price_min != null && s.price_max != null && s.price_min !== s.price_max
    setEditingId(s.id)
    setForm({
      name: s.name,
      price: String(s.price),
      slot_duration_min: String(s.slot_duration_min),
      price_type: isRange ? 'range' : 'fixed',
      price_min: s.price_min != null ? String(s.price_min) : String(s.price),
      price_max: s.price_max != null ? String(s.price_max) : String(s.price),
      allows_installment: !!s.allows_installment,
      downpayment_amount: s.downpayment_amount != null ? String(s.downpayment_amount) : '',
      num_installments: s.num_installments != null ? String(s.num_installments) : '',
      addToAllBranches: false,
    })
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
      const isRange = form.price_type === 'range'
      const price = isRange ? Number(form.price_min) : Number(form.price)
      // Installment requires a price range so the dentist has a min/max to choose within.
      const allowsInstallment = isRange && form.allows_installment
      const payload = {
        clinic_id: clinicId,
        name: form.name.trim(),
        price,
        price_min: isRange ? Number(form.price_min) : null,
        price_max: isRange ? Number(form.price_max) : null,
        slot_duration_min: Number(form.slot_duration_min),
        allows_installment: allowsInstallment,
        downpayment_amount: allowsInstallment ? Number(form.downpayment_amount) : null,
        num_installments: allowsInstallment ? Number(form.num_installments) : null,
      }

      let result
      if (editingId) {
        result = await updateService(editingId, payload)
      } else if (form.addToAllBranches && allClinicIds.length > 0) {
        const { name, price, price_min, price_max, slot_duration_min, allows_installment, downpayment_amount, num_installments } = payload
        result = await addServiceToAllBranches(
          { name, price, price_min, price_max, slot_duration_min, allows_installment, downpayment_amount, num_installments },
          allClinicIds
        )
      } else {
        result = await addService(payload)
      }

      if (!result.success) {
        setMsg({ type: 'error', text: result.error ?? 'Something went wrong.' })
        return
      }

      if (editingId) {
        setServices(prev =>
          prev.map(s => (s.id === editingId ? { ...s, ...payload } : s))
        )
        setMsg({ type: 'success', text: 'Service updated.' })
      } else if (form.addToAllBranches) {
        setMsg({ type: 'success', text: 'Service added to all branches.' })
      } else {
        const newService = (result as { success: true; service: Service }).service
        if (newService) {
          setServices(prev => [...prev, newService].sort((a, b) => a.name.localeCompare(b.name)))
        }
        setMsg({ type: 'success', text: 'Service added.' })
      }
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
