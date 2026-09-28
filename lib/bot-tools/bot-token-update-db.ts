/**
 * @fileoverview Смена Telegram-токена существующей записи через живой API (MCP)
 * @description Эквивалент TokenDisplayEdit: PUT /api/projects/:id/tokens/:tokenId.
 * Ответ агенту без секрета token (сервер отдаёт маску — здесь поле не включаем).
 * @module lib/bot-tools/bot-token-update-db
 */

import { apiFetch } from './api-fetch.ts';
import { isTelegramBotTokenFormat } from './bot-token-create-db.ts';
import type { ReadDbOptions } from './node-query-db.ts';

/** Безопасный результат обновления токена (без секрета) */
export interface UpdateBotTokenResult {
  /** Успех */
  ok: true;
  /** ID токена */
  id: number;
  /** Имя записи токена */
  name: string;
  /** Username бота (может не меняться — PUT не вызывает getMe) */
  botUsername: string | null;
  /** Флаг токена по умолчанию */
  isDefault: number | null;
  /** Флаг активности (при новом token сервер ставит 1) */
  isActive: number | null;
  /** Краткое пояснение */
  message?: string;
}

/** Сырой ответ PUT (token — маска; не отдавать агенту) */
interface RawUpdatedToken {
  /** ID */
  id?: number;
  /** Имя */
  name?: string;
  /** Username */
  botUsername?: string | null;
  /** isDefault */
  isDefault?: number | null;
  /** isActive */
  isActive?: number | null;
}

/**
 * Обновляет токен существующей записи проекта.
 * @param projectId - ID проекта из URL редактора
 * @param tokenId - ID записи токена
 * @param token - Новый токен от @BotFather
 * @param options - name?, apiBaseUrl
 * @returns Безопасные метаданные либо { error }
 */
export async function updateBotTokenInDb(
  projectId: number,
  tokenId: number,
  token: string,
  options?: ReadDbOptions & { name?: string },
): Promise<UpdateBotTokenResult | { error: string }> {
  const trimmed = token.trim();
  if (!trimmed) {
    return { error: 'Поле token обязательно' };
  }
  if (!isTelegramBotTokenFormat(trimmed)) {
    return {
      error: 'Неверный формат токена. Ожидается вид 123456789:ABCdef… от @BotFather',
    };
  }

  const body: Record<string, unknown> = { token: trimmed };
  const name = options?.name?.trim();
  if (name) {
    body.name = name;
  }

  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/tokens/${tokenId}`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 403) {
      return { error: `HTTP 403: нет доступа к проекту${text ? `: ${text}` : ''}` };
    }
    if (res.status === 404) {
      return { error: `HTTP 404: проект или токен не найден${text ? `: ${text}` : ''}` };
    }
    if (res.status === 400) {
      return { error: text ? `HTTP 400: ${text}` : 'HTTP 400: неверные данные' };
    }
    return { error: text ? `HTTP ${res.status}: ${text}` : `HTTP ${res.status}` };
  }

  let raw: RawUpdatedToken;
  try {
    raw = (await res.json()) as RawUpdatedToken;
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  if (typeof raw.id !== 'number') {
    return { error: 'Сервер не вернул id токена' };
  }

  return {
    ok: true,
    id: raw.id,
    name: raw.name ?? name ?? '',
    botUsername: raw.botUsername ?? null,
    isDefault: raw.isDefault ?? null,
    isActive: raw.isActive ?? null,
    message:
      'Токен обновлён. UI обновится через WS token-updated. '
      + 'botUsername мог не измениться (PUT не вызывает getMe).',
  };
}
