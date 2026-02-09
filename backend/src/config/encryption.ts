import crypto from 'crypto';
import env from './env';

/**
 * Encryption utilities using AES-256 (NFR-S1, NFR-S4)
 * Used for database encryption and backup encryption
 */

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Get encryption key from environment or generate a random one
 * Key must be 32 bytes (256 bits) for AES-256
 */
const getEncryptionKey = (): Buffer => {
  if (env.ENCRYPTION_KEY) {
    // Ensure key is exactly 32 bytes
    const key = Buffer.from(env.ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
    return key;
  }
  throw new Error('Encryption key not configured');
};

/**
 * Encrypt data using AES-256-CBC
 * @param text - Plain text to encrypt
 * @returns Encrypted data in format: iv:encryptedData
 */
export const encrypt = (text: string): string => {
  if (!env.ENCRYPTION_ENABLED) {
    return text;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using AES-256-CBC
 * @param encryptedData - Encrypted data in format: iv:encryptedData
 * @returns Decrypted plain text
 */
export const decrypt = (encryptedData: string): string => {
  if (!env.ENCRYPTION_ENABLED) {
    return encryptedData;
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Encrypt a file (for backup encryption)
 * @param filePath - Path to file to encrypt
 * @returns Encrypted file buffer
 */
export const encryptFile = async (fileBuffer: Buffer): Promise<Buffer> => {
  if (!env.ENCRYPTION_ENABLED) {
    return fileBuffer;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      iv,
      cipher.update(fileBuffer),
      cipher.final(),
    ]);

    return encrypted;
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
};

/**
 * Decrypt a file (for backup restoration)
 * @param encryptedBuffer - Encrypted file buffer
 * @returns Decrypted file buffer
 */
export const decryptFile = async (encryptedBuffer: Buffer): Promise<Buffer> => {
  if (!env.ENCRYPTION_ENABLED) {
    return encryptedBuffer;
  }

  try {
    const key = getEncryptionKey();
    const iv = encryptedBuffer.slice(0, IV_LENGTH);
    const encrypted = encryptedBuffer.slice(IV_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted;
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
};

/**
 * Generate a secure random encryption key
 * @returns 32-byte hex string suitable for AES-256
 */
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash data using SHA-256 (for integrity checks)
 * @param data - Data to hash
 * @returns SHA-256 hash
 */
export const hash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export default {
  encrypt,
  decrypt,
  encryptFile,
  decryptFile,
  generateEncryptionKey,
  hash,
};
