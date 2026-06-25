import { useState } from 'react'
import { updatePersonnel } from '@/actions/personnelActions'
import { FormattedStaff, FormattedDentist } from '@/types/clinic'


interface UseEditPersonnelProps {
  onClose: () => void
  onSuccess: () => Promise<void>
  person: FormattedStaff | FormattedDentist | null
  type: 'staff' | 'dentist'
}

export const useEditPersonnel = ({
  onClose,
  onSuccess,
  person,
  type,
}: UseEditPersonnelProps) => {
  const [formData, setFormData] = useState({
    firstName: person?.firstName || '',
    lastName: person?.lastName || '',
    email: person?.email || '',
    clinicId: person?.clinicId?.toString() || '',
    specialty: (person as FormattedDentist)?.specialty || ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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
    formData,
    setFormData,
    isSubmitting,
    error,
    handleSubmit,
  }
}
