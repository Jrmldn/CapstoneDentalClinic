export interface Service {
  id: number
  name: string
  price: number
  price_min?: number | null
  price_max?: number | null
  slot_duration_min: number
  is_active: boolean
  allows_installment?: boolean
  downpayment_amount?: number | null
  num_installments?: number | null
}

export interface ServicesTableProps {
  clinicId: number
  initialServices: Service[]
  viewerRole: 'superadmin' | 'staff'
  allClinicIds?: number[]
}

export interface Product {
  id: number
  name: string
  price: number
  price_min?: number | null
  price_max?: number | null
  is_active: boolean
}

export interface ProductsTableProps {
  clinicId: number
  initialProducts: Product[]
  viewerRole: 'superadmin' | 'staff'
  allClinicIds?: number[]
}
