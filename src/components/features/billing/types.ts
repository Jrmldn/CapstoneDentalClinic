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
  due_date: string
  amount: number
  penalty_amount: number
  status: 'pending' | 'paid' | 'overdue'
  paid_at: string | null
  created_at: string
}

export interface InstallmentPlan {
  id: number
  transaction_id: number | null
  clinic_id: number
  patient_id: number
  total_amount: number
  num_installments: number
  penalty_type: 'flat' | 'percentage'
  penalty_value: number
  notes: string | null
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
  patients?: { id: number; first_name: string; last_name: string } | null
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
  appointments?: {
    scheduled_at: string
    downpayment?: number | null
    dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
  } | { scheduled_at: string; downpayment?: number | null; dentists: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null }[] | null
}
