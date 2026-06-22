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
  due_date: string
  amount: number
}

function round2(value: number): number {
  return parseFloat(value.toFixed(2))
}

function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const base = new Date(y, m - 1 + months, d)
  const yy = base.getFullYear()
  const mm = String(base.getMonth() + 1).padStart(2, '0')
  const dd = String(base.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

// Fixed downpayment + fixed number of installments; monthly amount derived per patient.
// Installment 1 is the downpayment due on firstDueDate; each subsequent installment is
// one month later. The final installment absorbs any rounding remainder.
export function deriveInstallmentSchedule(
  total: number,
  downpayment: number,
  numInstallments: number,
  firstDueDate: string
): DerivedInstallment[] {
  const first = round2(Math.min(downpayment, total))
  const schedule: DerivedInstallment[] = [
    { installment_number: 1, due_date: firstDueDate, amount: first },
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
      due_date: addMonths(firstDueDate, i + 1),
      amount,
    })
  }

  return schedule
}
