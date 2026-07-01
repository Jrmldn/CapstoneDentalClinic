import { normalizeRelation } from '@/lib/utils'

export interface InstallmentServiceTerms {
  id: number
  name: string
  allows_installment: boolean
  downpayment_amount: number | null
  num_installments: number | null
}

interface LineItemWithService {
  services?: InstallmentServiceTerms | InstallmentServiceTerms[] | null
}

interface TransactionWithItems {
  transaction_items?: LineItemWithService[]
}

// First line-item service that is installment-eligible, or null.
// Drives both the "Set Installment" gating and the setup modal's terms.
export function getEligibleInstallmentService(tx: TransactionWithItems): InstallmentServiceTerms | null {
  for (const item of tx.transaction_items ?? []) {
    const service = normalizeRelation(item.services ?? null)
    if (service?.allows_installment) return service
  }
  return null
}

export interface DerivedInstallment {
  installment_number: number
  amount: number
}

function round2(value: number): number {
  return parseFloat(value.toFixed(2))
}

// Fixed downpayment + fixed number of installments; monthly amount derived per patient.
// Installment 1 is the downpayment; each subsequent installment is derived from remaining balance.
// The final installment absorbs any rounding remainder.
export function deriveInstallmentSchedule(
  total: number,
  downpayment: number,
  numInstallments: number
): DerivedInstallment[] {
  const first = round2(Math.min(downpayment, total))
  const schedule: DerivedInstallment[] = [
    { installment_number: 1, amount: first },
  ]

  const remaining = round2(total - first)
  const monthlyDerived = numInstallments > 0 ? round2(remaining / numInstallments) : remaining

  for (let i = 0; i < numInstallments; i++) {
    const isLast = i === numInstallments - 1
    const amount = isLast
      ? round2(remaining - monthlyDerived * (numInstallments - 1))
      : monthlyDerived
    schedule.push({
      installment_number: i + 2,
      amount,
    })
  }

  return schedule
}
