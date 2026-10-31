/** @fileoverview HMAC фактических байтов запроса доверенного Telegram-агента. */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

/** Запрос с сохранённым телом до разбора JSON. */
export interface AgentRawRequest extends IncomingMessage {
  /** Исходные байты тела */
  agentRawBody?: Buffer;
}

/** Сохраняет только небольшие тела серверных запросов агента. */
export function captureAgentBody(req: IncomingMessage, _res: unknown, body: Buffer): void {
  if (req.url?.startsWith('/api/auth/agent/')) {
    if (body.length > 8192) throw new Error('Тело запроса агента слишком большое');
    (req as AgentRawRequest).agentRawBody = Buffer.from(body);
  }
}

/** Подписывает метод, путь, время, nonce и хеш исходных байтов тела. */
export function signAgentRequest(secret: string, method: string, path: string,
  timestamp: string, nonce: string, body: Buffer): string {
  const hash = createHash('sha256').update(body).digest('hex');
  return createHmac('sha256', secret).update([method, path, timestamp, nonce, hash].join('\n')).digest('hex');
}

/** Сравнивает подписи без зависимости времени выполнения от совпавшего префикса. */
export function equalSignature(actual: string, expected: string): boolean {
  return /^[a-f0-9]{64}$/.test(actual) && timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}
