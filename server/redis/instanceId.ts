/**
 * @fileoverview Идентификатор инстанса Node для anti-loop Redis fan-out
 * @module server/redis/instanceId
 */

import { randomUUID } from 'crypto';

/** Стабильный ID процесса на время жизни инстанса */
const INSTANCE_ID = randomUUID();

/**
 * Возвращает уникальный ID текущего Node-инстанса
 * @returns UUID инстанса
 */
export function getInstanceId(): string {
  return INSTANCE_ID;
}
