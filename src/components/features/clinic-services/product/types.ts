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
