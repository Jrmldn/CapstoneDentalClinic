import 'server-only'

// Payments run in "stub mode" until PAYMONGO_SECRET_KEY is set, at which point
// real PayMongo links are created and fulfillment moves to the webhook.
export function isPaymongoConfigured() {
  return !!process.env.PAYMONGO_SECRET_KEY
}

export function getPaymongoSecretKey() {
  const key = process.env.PAYMONGO_SECRET_KEY
  if (!key) throw new Error('PAYMONGO_SECRET_KEY is not configured')
  return key
}

export function getPaymongoWebhookSecret() {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!secret) throw new Error('PAYMONGO_WEBHOOK_SECRET is not configured')
  return secret
}

// PayMongo runs in live mode only when a live secret key is used.
export function getPaymongoMode(): 'live' | 'test' {
  return process.env.PAYMONGO_SECRET_KEY?.startsWith('sk_live') ? 'live' : 'test'
}
