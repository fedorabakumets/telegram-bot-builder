/**
 * @fileoverview Разбор system-сообщений Python worker (bot_started / bot_exited)
 * @module server/bots/parseWorkerSystemMessage
 */

/** Разобранное system-событие воркера */
export interface ParsedWorkerSystemEvent {
  /** Вид события */
  kind: 'bot_started' | 'bot_exited' | 'bot_stopped' | 'other';
  /** ID токена, если есть */
  tokenId?: number;
  /** Статус из bot_exited */
  status?: string;
  /** Исходная строка */
  raw: string;
}

/**
 * Парсит content system-сообщения воркера
 * @param content - Строка content из JSON type=system
 * @returns Структурированное событие
 */
export function parseWorkerSystemMessage(content: string): ParsedWorkerSystemEvent {
  if (content.startsWith('bot_started:')) {
    const tokenId = parseInt(content.split(':')[1], 10);
    return { kind: 'bot_started', tokenId: Number.isFinite(tokenId) ? tokenId : undefined, raw: content };
  }
  if (content.startsWith('bot_exited:')) {
    const parts = content.split(':');
    const tokenId = parseInt(parts[1], 10);
    return {
      kind: 'bot_exited',
      tokenId: Number.isFinite(tokenId) ? tokenId : undefined,
      status: parts[2] || 'stopped',
      raw: content,
    };
  }
  if (content.startsWith('bot_stopped:')) {
    const tokenId = parseInt(content.split(':')[1], 10);
    return {
      kind: 'bot_stopped',
      tokenId: Number.isFinite(tokenId) ? tokenId : undefined,
      status: 'stopped',
      raw: content,
    };
  }
  return { kind: 'other', raw: content };
}
