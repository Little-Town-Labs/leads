import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encryptApiKey, decryptApiKey, validateEncryption, generateEncryptionSecret } from './encryption';

describe('Encryption Module', () => {
  const originalEnv = process.env.ENCRYPTION_SECRET;

  beforeEach(() => {
    // Set up test encryption secret (64 hex chars = 32 bytes)
    process.env.ENCRYPTION_SECRET = 'a'.repeat(64);
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.ENCRYPTION_SECRET = originalEnv;
    } else {
      delete process.env.ENCRYPTION_SECRET;
    }
  });

  describe('encryptApiKey', () => {
    it('should encrypt an API key and return a string', () => {
      const apiKey = 'sk-test-key-12345';
      const encrypted = encryptApiKey(apiKey);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should return encrypted string in correct format (iv:authTag:ciphertext)', () => {
      const apiKey = 'sk-test-key-12345';
      const encrypted = encryptApiKey(apiKey);

      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      // Each part should be base64
      expect(parts[0]).toMatch(/^[A-Za-z0-9+/=]+$/);
      expect(parts[1]).toMatch(/^[A-Za-z0-9+/=]+$/);
      expect(parts[2]).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should produce different ciphertext for same key (random IV)', () => {
      const apiKey = 'sk-test-key-12345';
      const encrypted1 = encryptApiKey(apiKey);
      const encrypted2 = encryptApiKey(apiKey);

      expect(encrypted1).not.toBe(encrypted2);
      // But both should decrypt to the same value
      expect(decryptApiKey(encrypted1)).toBe(apiKey);
      expect(decryptApiKey(encrypted2)).toBe(apiKey);
    });

    it('should throw error for empty API key', () => {
      expect(() => encryptApiKey('')).toThrow('API key cannot be empty');
    });

    it('should throw error if ENCRYPTION_SECRET not set', () => {
      delete process.env.ENCRYPTION_SECRET;
      expect(() => encryptApiKey('test-key')).toThrow('ENCRYPTION_SECRET environment variable is not set');
    });

    it('should handle special characters in API key', () => {
      const specialKey = 'sk-test!@#$%^&*()_+-={}[]|:;<>?,./~`';
      const encrypted = encryptApiKey(specialKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(specialKey);
    });

    it('should handle very long API keys', () => {
      const longKey = 'sk-' + 'a'.repeat(1000);
      const encrypted = encryptApiKey(longKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(longKey);
    });
  });

  describe('decryptApiKey', () => {
    it('should decrypt encrypted API key correctly', () => {
      const apiKey = 'sk-test-key-12345';
      const encrypted = encryptApiKey(apiKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should throw error for empty encrypted data', () => {
      expect(() => decryptApiKey('')).toThrow('Encrypted data cannot be empty');
    });

    it('should throw error for invalid format (missing parts)', () => {
      expect(() => decryptApiKey('invalid-format')).toThrow('Invalid encrypted data format');
      expect(() => decryptApiKey('only:two')).toThrow('Invalid encrypted data format');
    });

    it('should throw error for tampered ciphertext', () => {
      const apiKey = 'sk-test-key-12345';
      const encrypted = encryptApiKey(apiKey);
      const parts = encrypted.split(':');

      // Tamper with the ciphertext
      const tampered = [parts[0], parts[1], 'dGFtcGVyZWQ='].join(':');

      expect(() => decryptApiKey(tampered)).toThrow('Failed to decrypt API key');
    });

    it('should throw error for tampered auth tag', () => {
      const apiKey = 'sk-test-key-12345';
      const encrypted = encryptApiKey(apiKey);
      const parts = encrypted.split(':');

      // Tamper with the auth tag
      const tampered = [parts[0], 'dGFtcGVyZWQ=', parts[2]].join(':');

      expect(() => decryptApiKey(tampered)).toThrow('Failed to decrypt API key');
    });

    it('should throw error for tampered IV', () => {
      const apiKey = 'sk-test-key-12345';
      const encrypted = encryptApiKey(apiKey);
      const parts = encrypted.split(':');

      // Tamper with the IV
      const tampered = ['dGFtcGVyZWQ=', parts[1], parts[2]].join(':');

      expect(() => decryptApiKey(tampered)).toThrow('Failed to decrypt API key');
    });

    it('should throw error for invalid base64 encoding', () => {
      expect(() => decryptApiKey('!!!:!!!:!!!')).toThrow('Failed to decrypt API key');
    });

    it('should handle Unicode characters in decrypted key', () => {
      const unicodeKey = 'sk-test-键-🔑-key';
      const encrypted = encryptApiKey(unicodeKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(unicodeKey);
    });
  });

  describe('validateEncryption', () => {
    it('should return true for valid encryption setup', () => {
      expect(validateEncryption()).toBe(true);
    });

    it('should throw error if ENCRYPTION_SECRET not set', () => {
      delete process.env.ENCRYPTION_SECRET;
      expect(() => validateEncryption()).toThrow('ENCRYPTION_SECRET environment variable is not set');
    });

    it('should validate encryption round-trip', () => {
      // Should not throw
      expect(() => validateEncryption()).not.toThrow();
    });
  });

  describe('generateEncryptionSecret', () => {
    it('should generate 64-character hex string', () => {
      const secret = generateEncryptionSecret();

      expect(secret).toHaveLength(64);
      expect(secret).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different secrets each time', () => {
      const secret1 = generateEncryptionSecret();
      const secret2 = generateEncryptionSecret();

      expect(secret1).not.toBe(secret2);
    });

    it('should generate valid encryption secrets that work', () => {
      const newSecret = generateEncryptionSecret();
      process.env.ENCRYPTION_SECRET = newSecret;

      const testKey = 'sk-test-with-new-secret';
      const encrypted = encryptApiKey(testKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(testKey);
    });
  });

  describe('Encryption key handling', () => {
    it('should work with 64-character hex encryption secret', () => {
      const hexSecret = 'a1b2c3d4e5f6789012345678901234567890abcdefabcdefabcdef0123456789';
      process.env.ENCRYPTION_SECRET = hexSecret;

      const apiKey = 'sk-test-hex-secret';
      const encrypted = encryptApiKey(apiKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should hash non-hex secrets to create encryption key', () => {
      // Non-hex secret (will be hashed)
      process.env.ENCRYPTION_SECRET = 'my-super-secret-password';

      const apiKey = 'sk-test-hashed-secret';
      const encrypted = encryptApiKey(apiKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should handle mixed-case hex secrets', () => {
      const mixedHex = 'A1B2C3D4E5F6789012345678901234567890ABCDEFabcdefabcdef0123456789';
      process.env.ENCRYPTION_SECRET = mixedHex;

      const apiKey = 'sk-test-mixed-hex';
      const encrypted = encryptApiKey(apiKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(apiKey);
    });
  });

  describe('Security properties', () => {
    it('should use authenticated encryption (GCM)', () => {
      const apiKey = 'sk-test-security';
      const encrypted = encryptApiKey(apiKey);

      // Verify format includes auth tag
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);

      // Auth tag should be 16 bytes (base64 encoded ~24 chars)
      const authTag = Buffer.from(parts[1], 'base64');
      expect(authTag.length).toBe(16);
    });

    it('should use random IV for each encryption', () => {
      const apiKey = 'sk-test-iv';
      const encrypted1 = encryptApiKey(apiKey);
      const encrypted2 = encryptApiKey(apiKey);

      const iv1 = encrypted1.split(':')[0];
      const iv2 = encrypted2.split(':')[0];

      expect(iv1).not.toBe(iv2);
    });

    it('should produce different ciphertext for different keys', () => {
      const key1 = 'sk-test-key-1';
      const key2 = 'sk-test-key-2';

      const encrypted1 = encryptApiKey(key1);
      const encrypted2 = encryptApiKey(key2);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string after encryption secret check', () => {
      // This is already covered but good to be explicit
      expect(() => encryptApiKey('')).toThrow('API key cannot be empty');
    });

    it('should handle whitespace-only API keys', () => {
      const whitespaceKey = '   ';
      const encrypted = encryptApiKey(whitespaceKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(whitespaceKey);
    });

    it('should handle newlines and tabs in API keys', () => {
      const keyWithWhitespace = 'sk-test\n\twith\nwhitespace';
      const encrypted = encryptApiKey(keyWithWhitespace);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(keyWithWhitespace);
    });

    it('should handle extremely short API keys (single character)', () => {
      const shortKey = 'x';
      const encrypted = encryptApiKey(shortKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(shortKey);
    });
  });
});
