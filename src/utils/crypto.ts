/**
 * Cryptographic utilities for localStorage encryption
 * Uses Web Crypto API (native browser, zero dependencies)
 *
 * Architecture:
 * - User password → PBKDF2 derivation → AES-GCM key
 * - Settings are encrypted as JSON → encrypted blob → base64 storage
 * - Salt and IV are randomly generated per encryption and stored with ciphertext
 */

import { logger } from './logger'
import type { ConnectionSettings } from '@/types/camera'

// Encryption constants
const PBKDF2_ITERATIONS = 100000  // OWASP recommended minimum
const SALT_LENGTH = 16            // 128 bits
const IV_LENGTH = 12              // 96 bits (recommended for AES-GCM)
const KEY_LENGTH = 256            // AES-256

/**
 * Settings that will be encrypted and stored
 * (password is never stored, even encrypted)
 */
interface EncryptableSettings {
  host: string
  port: number
  username: string
  secure: boolean
  debugEnabled: boolean
  // proxyMode removed - always true
}

/**
 * Encrypted payload structure stored in localStorage
 */
interface EncryptedPayload {
  salt: string      // Base64-encoded salt for PBKDF2
  iv: string        // Base64-encoded initialization vector
  ciphertext: string // Base64-encoded encrypted data
}

/**
 * Derive AES key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derive AES-GCM key
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: KEY_LENGTH
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Encrypt connection settings (except password) using user's password
 *
 * @param settings - Connection settings to encrypt
 * @param password - User's password (used for key derivation)
 * @returns Encrypted payload as JSON string, ready for localStorage
 */
export async function encryptSettings(
  settings: ConnectionSettings,
  password: string
): Promise<string> {
  try {
    // Extract encryptable settings (never store password)
    const encryptable: EncryptableSettings = {
      host: settings.host,
      port: settings.port,
      username: settings.username,
      secure: settings.secure,
      debugEnabled: settings.debugEnabled
    }

    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    // Derive encryption key from password
    const key = await deriveKey(password, salt)

    // Encrypt settings
    const encoder = new TextEncoder()
    const plaintext = encoder.encode(JSON.stringify(encryptable))

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      plaintext
    )

    // Package encrypted data
    const payload: EncryptedPayload = {
      salt: arrayBufferToBase64(salt.buffer),
      iv: arrayBufferToBase64(iv.buffer),
      ciphertext: arrayBufferToBase64(ciphertext)
    }

    logger.debug('Settings encrypted successfully')
    return JSON.stringify(payload)
  } catch (error) {
    logger.error('Encryption failed:', error)
    throw new Error('Failed to encrypt settings')
  }
}

/**
 * Decrypt connection settings using user's password
 *
 * @param encryptedData - Encrypted payload JSON string from localStorage
 * @param password - User's password (used for key derivation)
 * @returns Decrypted connection settings (without password field)
 * @throws Error if decryption fails (wrong password or corrupted data)
 */
export async function decryptSettings(
  encryptedData: string,
  password: string
): Promise<Omit<ConnectionSettings, 'password'>> {
  try {
    // Parse encrypted payload
    const payload: EncryptedPayload = JSON.parse(encryptedData)

    // Convert base64 to binary
    const salt = new Uint8Array(base64ToArrayBuffer(payload.salt))
    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv))
    const ciphertext = base64ToArrayBuffer(payload.ciphertext)

    // Derive decryption key from password
    const key = await deriveKey(password, salt)

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    )

    // Parse decrypted settings
    const decoder = new TextDecoder()
    const settingsJson = decoder.decode(plaintext)
    const settings: EncryptableSettings = JSON.parse(settingsJson)

    logger.debug('Settings decrypted successfully')
    return settings
  } catch (error) {
    // AES-GCM authentication failure indicates wrong password
    if (error instanceof DOMException && error.name === 'OperationError') {
      logger.warn('Decryption failed: incorrect password')
      throw new Error('Incorrect password')
    }

    logger.error('Decryption failed:', error)
    throw new Error('Failed to decrypt settings')
  }
}

/**
 * Check if encrypted settings exist in localStorage
 *
 * @returns true if encrypted settings are present
 */
export function hasEncryptedSettings(): boolean {
  const encrypted = localStorage.getItem('camera-connection-settings-encrypted')
  return encrypted !== null && encrypted.length > 0
}
