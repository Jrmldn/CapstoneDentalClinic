export interface AppointmentOption {
  id: number
  scheduled_at: string
  downpayment?: number | null
  patients: { id: number; first_name: string; last_name: string } | { id: number; first_name: string; last_name: string }[] | null
  services: { id: number; name: string; price: number } | { id: number; name: string; price: number }[] | null
}

export interface Patient {
  id: number
  first_name: string
  last_name: string
}

export interface Service {
  id: number
  name: string
  price: number
}

export interface Product {
  id: number
  name: string
  price: number
}

export interface Transaction {
  id: number
  appointment_id?: number | null
  patient_id: number
  clinic_id: number
  subtotal: number
  discount_type: string
  discount_amount: number
  hmo_coverage: number
  philhealth_coverage: number
  total_amount: number
  payment_method: string
  payment_status: string
  created_at: string
  patients: { first_name: string; last_name: string } | null
  transaction_items?: {
    id: number
    description: string
    quantity: number
    unit_price: number
    total_price: number
  }[]
}
