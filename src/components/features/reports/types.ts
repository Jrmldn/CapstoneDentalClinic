export interface SalesSummary {
  totalTransactions: number
  totalRevenue: number
  totalSubtotal: number
  totalDiscounts: number
  totalPhilHealth: number
}

export interface SalesTransaction {
  id: number
  patients: { first_name: string; last_name: string } | null
  subtotal: number
  discount_amount: number
  total_amount: number
  payment_method: string | null
  payment_status: string
}

export interface SalesReport {
  success: boolean
  summary: SalesSummary
  transactions: SalesTransaction[]
}

export interface ApptSummary {
  total: number
  walkIns: number
  countByStatus: Record<string, number>
}

export interface ApptReport {
  success: boolean
  summary: ApptSummary
}

export interface ServiceFrequencyItem {
  id: number
  name: string
  price: number
  count: number
}

export interface ServiceFrequencyReport {
  success: boolean
  serviceFrequency: ServiceFrequencyItem[]
}
