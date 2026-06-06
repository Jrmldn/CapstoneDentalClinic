import { useState, useEffect } from 'react'
import { addStaff, addDentist } from '@/actions/personnelActions'
import { getClinics } from '@/lib/queries/clinics'

interface UseAddPersonnelProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'staff' | 'dentists'
}

/**
 * Custom Hook: useAddPersonnel
 * Manages the state, clinic list fetching, and form submission for adding new personnel.
 */
export const useAddPersonnel = ({ isOpen, onClose, onSuccess, type }: UseAddPersonnelProps) => {
  const [clinics, setClinics] = useState<{ id: number; name: string }[]>([])
  
  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clinicId, setClinicId] = useState('')
  const [specialty, setSpecialty] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Fetch clinics for the dropdown when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchClinics = async () => {
        const result = await getClinics()
        if (result.success && result.data) {
          setClinics(result.data)
        }
      }
      fetchClinics()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (!clinicId) {
      setError('Please select a clinic to assign this user to.')
      setIsSubmitting(false)
      return
    }

    try {
      const baseData = {
        firstName,
        lastName,
        email,
        password,
        clinicId: parseInt(clinicId)
      }

      let result
      if (type === 'staff') {
        result = await addStaff(baseData)
      } else {
        result = await addDentist({ ...baseData, specialty })
      }

      if (result.success) {
        // Reset form and close
        setFirstName('')
        setLastName('')
        setEmail('')
        setPassword('')
        setClinicId('')
        setSpecialty('')
        onSuccess() 
        onClose()
      } else {
        setError(result.error || `Failed to add ${type}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    clinics,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    clinicId,
    setClinicId,
    specialty,
    setSpecialty,
    isSubmitting,
    error,
    handleSubmit,
  }
}
