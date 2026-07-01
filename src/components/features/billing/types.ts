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
  price_min?: number | null
  price_max?: number | null
  allows_installment?: boolean | null
}

export interface Product {
  id: number
  name: string
  price: number
  price_min?: number | null
  price_max?: number | null
}

export interface InstallmentPayment {
  id: number
  plan_id: number
  installment_number: number
  amount: number
  status: string
  paid_at: string | null
  created_at: string | null
}

export interface InstallmentPlan {
  id: number
  transaction_id: number | null
  clinic_id: number
  patient_id: number
  total_amount: number
  num_installments: number
  notes: string | null
  status: string
  created_at: string | null
  patients?: { id: number; first_name: string; last_name: string } | null
  clinics?: { id: number; name: string } | null
  transactions?: { id: number; created_at: string } | null
  installment_payments?: InstallmentPayment[]
}

export interface Transaction {
  id: number
  appointment_id?: number | null
  patient_id: number
  clinic_id: number
  billing_status: string
  subtotal: number
  discount_type: string | null
  discount_amount: number | null
  hmo_coverage: number | null
  philhealth_coverage: number | null
  total_amount: number
  payment_method: string | null
  payment_status: string | null
  created_at: string | null
  patients: { first_name: string; last_name: string } | null
  transaction_items?: {
    id: number
    description: string
    quantity: number
    unit_price: number
    total_price: number
    services?: {
      id: number
      name: string
      allows_installment: boolean
      downpayment_amount: number | null
      num_installments: number | null
    } | {
      id: number
      name: string
      allows_installment: boolean
      downpayment_amount: number | null
      num_installments: number | null
    }[] | null
  }[]
  appointments?: {
    scheduled_at: string
    downpayment?: number | null
    dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
  } | { scheduled_at: string; downpayment?: number | null; dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null }[] | null
}
