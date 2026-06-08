import { DiscountType, TransactionItem } from '@/actions/billingActions'

// Discount rates (PWD/Senior = 20% on subtotal by PH law)
export const DISCOUNT_RATES: Record<DiscountType, number> = {
  none:       0,
  senior:     0.20,
  pwd:        0.20,
  hmo:        0,     // HMO uses coverage amount directly
  philhealth: 0,     // PhilHealth uses coverage amount directly
}

/**
 * Calculates subtotal, discount, and final total amounts for a transaction.
 */
export function calculateTransactionAmounts(
  items: TransactionItem[],
  discountType: DiscountType,
  hmoCoverage: number = 0,
  philhealthCoverage: number = 0
) {
  // 1. Calculate subtotal from items
  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  )

  // 2. Calculate discount amount
  const discountRate = DISCOUNT_RATES[discountType]
  const discount_amount = parseFloat((subtotal * discountRate).toFixed(2))

  // 3. Compute total
  const total_amount = parseFloat(
    Math.max(0, subtotal - discount_amount - hmoCoverage - philhealthCoverage).toFixed(2)
  )

  return {
    subtotal,
    discount_amount,
    total_amount,
  }
}
