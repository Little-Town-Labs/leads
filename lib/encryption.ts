import crypto from 'crypto';

/**
 * Encryption service for API keys using AES-256-GCM
 *
 * Security features:
 * - AES-256-GCM encryption (authenticated encryption)
 * - Random IV for each encryption
 * - Authentication tag for integrity verification
 * - Base64 encoding for storage
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const KEY_LENGTH = 32; // 256-bit key

/**
 * Get encryption key from environment variable
 * Key should be a 32-byte (64 hex chars) random value
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }

  // If secret is hex-encoded (64 chars), decode it
  if (secret.length === KEY_LENGTH * 2 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }

  // Otherwise, hash the secret to get a 32-byte key
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt an API key
 *
 * @param apiKey - The plaintext API key to encrypt
 * @returns Encrypted data as base64 string (format: iv:authTag:ciphertext)
 *
 * @example
 * const encrypted = encryptApiKey('sk-abc123...');
 * // Returns: "1a2b3c4d...5e6f:7g8h9i...0j1k:2l3m4n..."
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey) {
    throw new Error('API key cannot be empty');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(apiKey, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag().toString('base64');

    // Format: iv:authTag:ciphertext
    return `${iv.toString('base64')}:${authTag}:${encrypted}`;
  } catch (error) {
    throw new Error(`Failed to encrypt API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt an API key
 *
 * @param encryptedData - The encrypted API key (format: iv:authTag:ciphertext)
 * @returns Decrypted plaintext API key
 *
 * @example
 * const decrypted = decryptApiKey('1a2b3c4d...5e6f:7g8h9i...0j1k:2l3m4n...');
 * // Returns: "sk-abc123..."
 */
export function decryptApiKey(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Encrypted data cannot be empty');
  }

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format (expected iv:authTag:ciphertext)');
    }

    const [ivBase64, authTagBase64, encryptedBase64] = parts;

    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`Failed to decrypt API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate that an API key can be encrypted and decrypted
 * Useful for testing encryption setup
 *
 * @returns true if encryption is working, throws error otherwise
 */
export function validateEncryption(): boolean {
  const testKey = 'test-api-key-12345';
  const encrypted = encryptApiKey(testKey);
  const decrypted = decryptApiKey(encrypted);

  if (decrypted !== testKey) {
    throw new Error('Encryption validation failed: decrypted value does not match original');
  }

  return true;
}

/**
 * Generate a new random encryption secret (for setup)
 * Run this once and save the output to your environment variables
 *
 * @returns 64-character hex string (32 bytes)
 *
 * @example
 * // Run once during setup:
 * const secret = generateEncryptionSecret();
 * console.log('Add to .env.local:', secret);
 * // ENCRYPTION_SECRET=a1b2c3d4e5f6...
 */
export function generateEncryptionSecret(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
