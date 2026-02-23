import {randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';

const HASH_PREFIX = 'scrypt';
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${HASH_PREFIX}$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [prefix, salt, expectedHash] = storedHash.split('$');
  if (prefix !== HASH_PREFIX || !salt || !expectedHash) return false;
  const actualHash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  try {
    return timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}
