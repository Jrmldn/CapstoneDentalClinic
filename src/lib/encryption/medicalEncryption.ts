'server only'

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12  // 96-bit IV — GCM recommended
const TAG_LENGTH = 16 // 128-bit auth tag — GCM default

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error('ENCRYPTION_KEY environment variable is not set')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (44 base64 chars)')
  return key
}

const ENC_PREFIX = 'enc:'

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: `enc:<iv_b64>.<authTag_b64>.<ciphertext_b64>`
 */
export async function encryptMedicalData(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${ENC_PREFIX}${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`
}

/**
 * Decrypts a value produced by `encryptMedicalData`.
 * Returns the value as-is if it has no `enc:` prefix (backward compat for existing plaintext rows).
 */
export async function decryptMedicalData(value: string): Promise<string> {
  if (!value || !value.startsWith(ENC_PREFIX)) return value

  try {
    const key = getKey()
    const parts = value.slice(ENC_PREFIX.length).split('.')
    if (parts.length !== 3) throw new Error('Invalid ciphertext format')

    const iv = Buffer.from(parts[0], 'base64')
    const authTag = Buffer.from(parts[1], 'base64')
    const encrypted = Buffer.from(parts[2], 'base64')

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
    decipher.setAuthTag(authTag)

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  } catch (error) {
    // Log decryption failure inside catch block (e.g. on mismatched key)
    console.error('Failed to decrypt medical data (possibly due to mismatched ENCRYPTION_KEY):', error instanceof Error ? error.message : error)
    return value
  }
}
