'use client'

import { useState } from 'react'
import ClinicHeader from './components/ClinicHeader'
import ClinicFilters from './components/ClinicFilters'
import ClinicTable from './components/ClinicTable'
import AddClinicModal from './components/AddClinicModal'

interface ClinicData {
  id: number
  name: string
  users: number
  status: 'active' | 'inactive'
  email: string
  phone: string
  address: string
  capacity: number
}

export default function ClientClinicPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clinics, setClinics] = useState<ClinicData[]>([
    {
      id: 1,
      name: 'Number 1 Clinic',
      users: 50,
      status: 'active',
      email: 'email@email.com',
      phone: '09876543321',
      address: 'Cavite, San Francisco',
      capacity: 20,
    },
    {
      id: 2,
      name: 'Number 2 Clinic',
      users: 22,
      status: 'active',
      email: 'clinic2@email.com',
      phone: '09876543322',
      address: 'Manila, Philippines',
      capacity: 25,
    },
    {
      id: 3,
      name: 'Number 3 Clinic',
      users: 40,
      status: 'active',
      email: 'clinic3@email.com',
      phone: '09876543323',
      address: 'Quezon City, Philippines',
      capacity: 30,
    },
    {
      id: 4,
      name: 'Number 4 Clinic',
      users: 43,
      status: 'inactive',
      email: 'clinic4@email.com',
      phone: '09876543324',
      address: 'Makati, Philippines',
      capacity: 28,
    },
    {
      id: 5,
      name: 'Number 5 Clinic',
      users: 57,
      status: 'active',
      email: 'clinic5@email.com',
      phone: '09876543325',
      address: 'Pasig, Philippines',
      capacity: 35,
    },
  ])

  const handleAddClinic = (data: any) => {
    const newClinic: ClinicData = {
      id: clinics.length + 1,
      name: data.name,
      users: 0,
      status: 'active',
      email: data.email,
      phone: data.phone,
      address: data.address,
      capacity: data.dailyCapacity,
    }
    setClinics([...clinics, newClinic])
  }

  return (
    <div className="p-8">
      {/* Header */}
      <ClinicHeader onAddClick={() => setIsModalOpen(true)} />

      {/* Filters */}
      <ClinicFilters />

      {/* Table */}
      <ClinicTable clinics={clinics} />

      {/* Modal */}
      <AddClinicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddClinic}
      />
    </div>
  )
}
