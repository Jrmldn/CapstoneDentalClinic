import { useState, useEffect } from 'react'
import { updatePersonnel } from '@/actions/personnelActions'
import { getClinics } from '@/lib/queries/clinics'
import { FormattedStaff, FormattedDentist } from '@/types/clinic'


interface UseEditPersonnelProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
  person: FormattedStaff | FormattedDentist | null
  type: 'staff' | 'dentists'
}

export const useEditPersonnel = ({
  isOpen,
  onClose,
  onSuccess,
  person,
  type,
}: UseEditPersonnelProps) => {
  const [clinics, setClinics] = useState<{ id: number; name: string }[]>([])
  
  const [formData, setFormData] = useState({
    firstName: person?.firstName || '',
    lastName: person?.lastName || '',
    email: person?.email || '',
    clinicId: person?.clinicId?.toString() || '',
    specialty: (person as FormattedDentist)?.specialty || ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load clinic options when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchClinics = async () => {
        const result = await getClinics()
        if (result.success && result.data) setClinics(result.data)
      }
      fetchClinics()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!person) return

    setIsSubmitting(true)
    setError('')

    const result = await updatePersonnel(person.userId, type, {
      ...formData,
      clinicId: parseInt(formData.clinicId)
    })

    if (result.success) {
      await onSuccess()
      onClose()
    } else {
      setError(result.error || 'Failed to update')
    }
    setIsSubmitting(false)
  }

  return {
    clinics,
    formData,
    setFormData,
    isSubmitting,
    error,
    handleSubmit,
  }
}
