/**
 * @fileoverview Создание токена бота через живой API (MCP)
 * @description Получает профиль через tokens/parse, затем сохраняет через tokens, как модалка.
 * Ответ агенту без секрета token (сервер отдаёт полный token — здесь вырезаем).
 * @module lib/bot-tools/bot-token-create-db
 */

import { apiFetch } from './api-fetch.ts';
import type { ReadDbOptions } from './node-query-db.ts';

/** Формат Telegram bot token: `{botId}:{секрет}` */
const TOKEN_REGEX = /^\d+:[A-Za-z0-9_-]{35,}$/;

/** Безопасный результат добавления токена (без секрета) */
export interface AddBotTokenResult {
  /** Успех */
  ok: true;
  /** true — создан новый; false — уже был в проекте (дубликат) */
  created: boolean;
  /** ID токена для db_list_bot_tokens / db_start_bot */
  id: number;
  /** Имя записи токена */
  name: string;
  /** Username бота из Telegram (без @) или null */
  botUsername: string | null;
  /** Флаг токена по умолчанию */
  isDefault: number | null;
  /** Флаг активности */
  isActive: number | null;
  /** Краткое пояснение */
  message?: string;
}

/** Сырой ответ POST create (может содержать секрет — не отдавать агенту) */
interface RawCreatedToken {
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
 * Проверяет формат токена Telegram Bot API.
 * @param token - Сырая строка токена
 * @returns true если формат похож на BotFather-токен
 */
export function isTelegramBotTokenFormat(token: string): boolean {
  return TOKEN_REGEX.test(token.trim());
}

/**
 * Добавляет токен бота в проект (модалка «Подключить бота»).
 * Дубликат того же token в проекте → ok + created: false (как API 200).
 * @param projectId - ID проекта из URL редактора
 * @param token - Токен от @BotFather
 * @param options - name, isDefault, apiBaseUrl
 * @returns Безопасные метаданные токена либо { error }
 */
export async function addBotTokenInDb(
  projectId: number,
  token: string,
  options?: ReadDbOptions & { name?: string; isDefault?: boolean },
): Promise<AddBotTokenResult | { error: string }> {
  const trimmed = token.trim();
  if (!trimmed) {
    return { error: 'Поле token обязательно' };
  }
  if (!isTelegramBotTokenFormat(trimmed)) {
    return {
      error: 'Неверный формат токена. Ожидается вид 123456789:ABCdef… от @BotFather',
    };
  }

  /** Профиль получаем до создания, чтобы сбой Telegram не оставлял неполную запись. */
  let profile: Record<string, unknown>;
  try {
    const parsed = await apiFetch(`/api/projects/${projectId}/tokens/parse`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: trimmed }),
    });
    if (!parsed.ok) {
      return { error: `Не удалось получить профиль бота (HTTP ${parsed.status})` };
    }
    profile = await parsed.json();
    if (!profile || typeof profile.botFirstName !== 'string' || !profile.botFirstName.trim()) {
      return { error: 'Сервер не вернул имя бота при получении профиля' };
    }
  } catch {
    return { error: 'Не удалось получить профиль бота. Проверьте доступность сервера и Telegram.' };
  }
  const name = options?.name?.trim() || `${profile.botFirstName}${profile.botUsername ? ` (@${profile.botUsername})` : ''}`;
  const body: Record<string, unknown> = {
    ...profile,
    name,
    token: trimmed,
    description: profile.botShortDescription,
    isActive: 1,
    isDefault: options?.isDefault === true ? 1 : 0,
  };

  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/tokens`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
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
      return { error: `HTTP 404: проект не найден${text ? `: ${text}` : ''}` };
    }
    if (res.status === 400) {
      return { error: text ? `HTTP 400: ${text}` : 'HTTP 400: неверные данные' };
    }
    return { error: text ? `HTTP ${res.status}: ${text}` : `HTTP ${res.status}` };
  }

  let raw: RawCreatedToken;
  try {
    raw = (await res.json()) as RawCreatedToken;
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  if (typeof raw.id !== 'number') {
    return { error: 'Сервер не вернул id токена' };
  }

  const created = res.status === 201;
  return {
    ok: true,
    created,
    id: raw.id,
    name: raw.name ?? name,
    botUsername: raw.botUsername ?? null,
    isDefault: raw.isDefault ?? null,
    isActive: raw.isActive ?? null,
    message: created
      ? 'Токен добавлен. UI обновится через WS token-created.'
      : 'Токен уже был в проекте — возвращён существующий.',
  };
}
