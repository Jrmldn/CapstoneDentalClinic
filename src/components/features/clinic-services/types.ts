/**
 * Type Definitions for Services Module
 * Extracted to ensure strict typing across components and hooks.
 */

export interface Service {
  id: number
  name: string
  price: number
  slot_duration_min: number
  is_active: boolean
}

export interface ServicesTableProps {
  clinicId: number
  initialServices: Service[]
}

export interface Product {
  id: number
  name: string
  price: number
  is_active: boolean
}

export interface ProductsTableProps {
  clinicId: number
  initialProducts: Product[]
}
