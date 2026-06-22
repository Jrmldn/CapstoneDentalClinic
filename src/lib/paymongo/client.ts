import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { getPaymongoSecretKey } from './env'

const PAYMONGO_API = 'https://api.paymongo.com/v1'

export interface PaymongoLink {
  id: string
  checkoutUrl: string
  status: string // 'unpaid' | 'paid'
  referenceNumber: string
}

function authHeader() {
  // PayMongo uses HTTP Basic auth: base64("<secret_key>:")
  return 'Basic ' + Buffer.from(`${getPaymongoSecretKey()}:`).toString('base64')
}

function mapLink(data: {
  id: string
  attributes: { checkout_url: string; status: string; reference_number: string }
}): PaymongoLink {
  return {
    id: data.id,
    checkoutUrl: data.attributes.checkout_url,
    status: data.attributes.status,
    referenceNumber: data.attributes.reference_number,
  }
}

// Creates a hosted checkout link. Amount is in PHP (converted to centavos here).
export async function createPaymentLink(params: {
  amount: number
  description: string
  remarks?: string
}): Promise<PaymongoLink> {
  const res = await fetch(`${PAYMONGO_API}/links`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(params.amount * 100),
          description: params.description,
          remarks: params.remarks,
        },
      },
    }),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.detail ?? 'PayMongo link creation failed')
  }
  return mapLink(json.data)
}

// Fetches a link's current state — used by the polling fallback.
export async function getPaymentLink(linkId: string): Promise<PaymongoLink> {
  const res = await fetch(`${PAYMONGO_API}/links/${linkId}`, {
    headers: { Authorization: authHeader() },
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.detail ?? 'PayMongo link fetch failed')
  }
  return mapLink(json.data)
}

// Verifies a PayMongo webhook signature.
// Header format: "t=<timestamp>,te=<test_sig>,li=<live_sig>"
// Signature = HMAC-SHA256(`${t}.${rawBody}`, webhookSecret)
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  mode: 'live' | 'test'
): boolean {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map(p => p.split('=') as [string, string])
  )
  const timestamp = parts.t
  const provided = mode === 'live' ? parts.li : parts.te
  if (!timestamp || !provided) return false

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  const expectedBuf = Buffer.from(expected)
  const providedBuf = Buffer.from(provided)
  if (expectedBuf.length !== providedBuf.length) return false
  return timingSafeEqual(expectedBuf, providedBuf)
}
