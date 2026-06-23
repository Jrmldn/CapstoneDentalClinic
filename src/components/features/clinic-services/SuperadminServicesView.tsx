'use client'

import React, { useState } from 'react'
import { Building2, Loader2, ArrowRight, Settings } from 'lucide-react'
import ServicesTable from './service/ServicesTable'
import ProductsTable from './product/ProductsTable'
import { fetchServices, fetchProducts } from '@/actions/serviceActions'
import type { Service } from './service/types'
import type { Product } from './product/types'

interface ClinicOption {
  id: number
  name: string
}

interface SuperadminServicesViewProps {
  clinics: ClinicOption[]
  mode: 'services' | 'products'
}

const COPY = {
  services: {
    title: 'Services Management',
    subtitle: 'Configure, add, or update dental services for each branch clinic.',
  },
  products: {
    title: 'Products Management',
    subtitle: 'Configure, add, or update retail products for each branch clinic.',
  },
}

export default function SuperadminServicesView({ clinics, mode }: SuperadminServicesViewProps) {
  const allClinicIds = clinics.map(c => c.id)
  const [selectedClinicId, setSelectedClinicId] = useState<number | ''>('')
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleClinicChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (!val) {
      setSelectedClinicId('')
      setServices([])
      setProducts([])
      return
    }

    const clinicId = Number(val)
    setSelectedClinicId(clinicId)
    setIsLoading(true)

    try {
      if (mode === 'services') {
        const res = await fetchServices(clinicId)
        setServices(res.success ? res.services : [])
      } else {
        const res = await fetchProducts(clinicId)
        setProducts(res.success ? res.products : [])
      }
    } catch (err) {
      console.error('Failed to load items for clinic:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{COPY[mode].title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {COPY[mode].subtitle}
          </p>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-xs min-w-[280px]">
          <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none mb-0.5">Select Branch</span>
            <select
              value={selectedClinicId}
              onChange={handleClinicChange}
              disabled={isLoading}
              className="w-full text-xs font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer focus:ring-0 p-0"
            >
              <option value="">Choose a branch...</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium text-slate-500">Loading branch services and products...</p>
        </div>
      ) : selectedClinicId ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
          {mode === 'services' ? (
            <ServicesTable
              key={selectedClinicId}
              clinicId={selectedClinicId}
              initialServices={services}
              viewerRole="superadmin"
              allClinicIds={allClinicIds}
            />
          ) : (
            <ProductsTable
              key={selectedClinicId}
              clinicId={selectedClinicId}
              initialProducts={products}
              viewerRole="superadmin"
              allClinicIds={allClinicIds}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-2xl shadow-xs text-center px-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">No Branch Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
            Select one of your clinic branches in the header dropdown to manage its {mode === 'services' ? 'dental services and treatment prices' : 'retail products and prices'}.
          </p>
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 animate-pulse">
            Select a branch above to start <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}
    </div>
  )
}
