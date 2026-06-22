'use client'

import { useState } from 'react'
import { Stethoscope, Package } from 'lucide-react'
import ServicesTable from '@/components/features/clinic-services/ServicesTable'
import ProductsTable from '@/components/features/clinic-services/ProductsTable'
import type { Service, Product } from './types'

const TABS = [
  { key: 'services', label: 'Dental Services', icon: Stethoscope },
  { key: 'products', label: 'Products', icon: Package },
]

interface Props {
  clinicId: number
  initialServices: Service[]
  initialProducts: Product[]
  viewerRole: 'superadmin' | 'staff'
  allClinicIds?: number[]
}

export default function ServicesTabs({ clinicId, initialServices, initialProducts, viewerRole, allClinicIds }: Props) {
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services')

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'services' | 'products')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'services' && (
        <ServicesTable
          clinicId={clinicId}
          initialServices={initialServices}
          viewerRole={viewerRole}
          allClinicIds={allClinicIds}
        />
      )}
      {activeTab === 'products' && (
        <ProductsTable
          clinicId={clinicId}
          initialProducts={initialProducts}
          viewerRole={viewerRole}
          allClinicIds={allClinicIds}
        />
      )}
    </div>
  )
}
