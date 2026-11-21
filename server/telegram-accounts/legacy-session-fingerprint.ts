/** @fileoverview Внутренний отпечаток ключа авторизации сессии Telethon. */
import { createHash } from 'node:crypto';

/**
 * Вычисляет неприменимый для входа отпечаток ключа сессии Telethon версии 1.
 * @param session - Строка сессии из серверного хранилища.
 * @returns Отпечаток ключа или null для неподдерживаемой сессии.
 */
export function fingerprintLegacyTelegramSession(session: string): string | null {
  const encoded = session.slice(1);
  if (session[0] !== '1' || (encoded.length !== 352 && encoded.length !== 368)) return null;
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(encoded)) return null;

  const decoded = Buffer.from(encoded, 'base64url');
  try {
    const expectedLength = encoded.length === 352 ? 263 : 275;
    if (decoded.length !== expectedLength || decoded.toString('base64url') !== encoded.replace(/=+$/, '')) return null;
    const key = decoded.subarray(decoded.length - 256);
    if (decoded[0] === 0 || decoded.readUInt16BE(decoded.length - 258) === 0 || !key.some(byte => byte !== 0)) return null;
    return createHash('sha256').update('telegram-account-auth-key\0').update(key).digest('hex');
  } finally {
    decoded.fill(0);
  }
}
