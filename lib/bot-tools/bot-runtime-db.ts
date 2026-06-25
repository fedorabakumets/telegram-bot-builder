/**
 * @fileoverview Runtime-операции над живой БД через API (read-only блок RUNTIME MCP)
 * @description Безопасный дискавери токенов проекта и read-only инструменты состояния
 * запущенного бота: статус, live-логи, история запусков. Все функции ходят в API
 * запущенного приложения через общий хелпер apiFetch (несёт Authorization: Bearer из
 * MCP_AGENT_TOKEN). Секрет botToken НИКОГДА не раскрывается агенту: сервер вырезает его
 * через DTO, а здесь дополнительно маппятся только безопасные whitelist-поля.
 * @module lib/bot-tools/bot-runtime-db
 */

import { apiFetch } from './api-fetch.ts';
import type { ReadDbOptions } from './node-query-db.ts';

/** Лёгкий безопасный элемент списка токенов бота (без секрета token) */
export interface BotTokenListDto {
  /** Уникальный идентификатор токена (нужен для db_bot_status/db_bot_logs) */
  id: number;
  /** Пользовательское имя токена */
  name: string;
  /** Имя пользователя бота (@username) из Telegram API */
  botUsername: string | null;
  /** Флаг токена по умолчанию (0 = нет, 1 = да) */
  isDefault: number | null;
  /** Флаг активности токена (0 = неактивен, 1 = активен) */
  isActive: number | null;
}

/** Сырой элемент ответа GET /api/projects/:id/tokens/list (после серверного DTO, без секретов) */
interface RawBotTokenListItem {
  /** ID токена */
  id: number;
  /** Имя токена */
  name?: string;
  /** Username бота */
  botUsername?: string | null;
  /** Флаг токена по умолчанию */
  isDefault?: number | null;
  /** Флаг активности */
  isActive?: number | null;
}

/**
 * Возвращает список токенов проекта из живой БД (read-only, без секрета token).
 * Нужен для дискавери: по нему агент узнаёт token_id для db_bot_status/db_bot_logs/
 * db_bot_launch_history. Отдаёт только лёгкие безопасные поля.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param options - Опции чтения (URL API)
 * @returns Число токенов и массив лёгких метаданных, либо ошибка
 */
export async function listBotTokensInDb(
  projectId: number,
  options?: ReadDbOptions,
): Promise<{ total: number; tokens: BotTokenListDto[] } | { error: string }> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/tokens/list`, { apiBaseUrl: options?.apiBaseUrl });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let arr: RawBotTokenListItem[];
  try {
    arr = (await res.json()) as RawBotTokenListItem[];
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  const tokens: BotTokenListDto[] = arr.map((t) => ({
    id: t.id,
    name: t.name ?? '',
    botUsername: t.botUsername ?? null,
    isDefault: t.isDefault ?? null,
    isActive: t.isActive ?? null,
  }));

  return { total: tokens.length, tokens };
}

/** Безопасный статус бота для агента (без секрета token) */
export interface BotStatusDto {
  /** Технический статус бота: running, stopped или unknown */
  status: string;
  /** Человекочитаемая подпись статуса (например «🟢 Работает») */
  statusLabel: string | null;
  /** Имя бота (из имени токена) */
  botName: string | null;
  /** Username бота (@username) */
  botUsername: string | null;
  /** Время работы в читаемом виде (например «3д 14ч 22м») или null */
  uptime: string | null;
  /** Время запуска бота (ISO-строка) или null */
  startedAt: string | null;
  /** Статистика пользователей бота (строки с разделителями тысяч) */
  userStats: Record<string, string> | null;
}

/** Сырой ответ GET /api/bot/tokens/:tokenId/status */
interface RawBotStatus {
  /** Технический статус */
  status?: string;
  /** Статистика пользователей */
  userStats?: Record<string, string> | null;
  /** Данные экземпляра бота */
  instance?: {
    /** Имя бота */
    botName?: string | null;
    /** Username бота */
    botUsername?: string | null;
    /** Подпись статуса */
    statusLabel?: string | null;
    /** Время работы */
    uptime?: string | null;
    /** Время запуска */
    startedAt?: string | null;
  } | null;
}

/**
 * Возвращает статус бота по token_id из живой БД (read-only).
 * Маппит только безопасные поля; секрет token наружу не пробрасывается.
 * @param tokenId - Числовой ID токена (из db_list_bot_tokens)
 * @param options - Опции чтения (URL API)
 * @returns Безопасный DTO статуса, либо ошибка
 */
export async function botStatusInDb(
  tokenId: number,
  options?: ReadDbOptions,
): Promise<BotStatusDto | { error: string }> {
  let res: Response;
  try {
    res = await apiFetch(`/api/bot/tokens/${tokenId}/status`, { apiBaseUrl: options?.apiBaseUrl });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: токен не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: RawBotStatus;
  try {
    body = (await res.json()) as RawBotStatus;
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  const instance = body.instance ?? null;
  return {
    status: body.status ?? 'unknown',
    statusLabel: instance?.statusLabel ?? null,
    botName: instance?.botName ?? null,
    botUsername: instance?.botUsername ?? null,
    uptime: instance?.uptime ?? null,
    startedAt: instance?.startedAt ?? null,
    userStats: body.userStats ?? null,
  };
}

/** Лёгкая безопасная запись live-лога бота */
export interface BotLogDto {
  /** Содержимое строки лога */
  content: string;
  /** Тип строки лога: stdout, stderr или status */
  type: string;
  /** Временная метка создания записи (ISO-строка) или null */
  timestamp: string | null;
}

/** Сырая запись лога из ответа GET .../logs */
interface RawBotLog {
  /** Содержимое строки лога */
  content?: string;
  /** Тип строки лога */
  type?: string;
  /** Временная метка */
  timestamp?: string | null;
}

/**
 * Возвращает последние live-логи бота из живой БД (read-only) — для отладки.
 * Маппит только лёгкие безопасные поля { content, type, timestamp }.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param tokenId - Числовой ID токена (из db_list_bot_tokens)
 * @param limit - Максимум записей (по умолчанию 100)
 * @param options - Опции чтения (URL API)
 * @returns Число записей и массив логов, либо ошибка
 */
export async function botLogsInDb(
  projectId: number,
  tokenId: number,
  limit = 100,
  options?: ReadDbOptions,
): Promise<{ total: number; logs: BotLogDto[] } | { error: string }> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/tokens/${tokenId}/logs?limit=${limit}`, {
      apiBaseUrl: options?.apiBaseUrl,
    });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект или токен не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let arr: RawBotLog[];
  try {
    arr = (await res.json()) as RawBotLog[];
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  const logs: BotLogDto[] = arr.map((l) => ({
    content: l.content ?? '',
    type: l.type ?? 'stdout',
    timestamp: l.timestamp ?? null,
  }));

  return { total: logs.length, logs };
}

/** Безопасная запись истории запуска бота */
export interface BotLaunchHistoryDto {
  /** Уникальный идентификатор записи */
  id: number;
  /** Статус запуска: running, stopped или error */
  status: string;
  /** Время запуска бота (ISO-строка) или null */
  startedAt: string | null;
  /** Время остановки бота (ISO-строка) или null если ещё работает */
  stoppedAt: string | null;
  /** Сообщение об ошибке или null */
  errorMessage: string | null;
  /** Идентификатор системного процесса или null */
  processId: string | null;
}

/** Сырая запись истории запуска из ответа GET .../launch-history */
interface RawBotLaunchHistory {
  /** ID записи */
  id: number;
  /** Статус запуска */
  status?: string;
  /** Время запуска */
  startedAt?: string | null;
  /** Время остановки */
  stoppedAt?: string | null;
  /** Сообщение об ошибке */
  errorMessage?: string | null;
  /** Идентификатор процесса */
  processId?: string | null;
}

/**
 * Возвращает историю запусков бота по token_id из живой БД (read-only).
 * Маппит только безопасные поля; секрет token наружу не пробрасывается.
 * @param tokenId - Числовой ID токена (из db_list_bot_tokens)
 * @param options - Опции чтения (URL API)
 * @returns Число записей и массив истории запусков, либо ошибка
 */
export async function botLaunchHistoryInDb(
  tokenId: number,
  options?: ReadDbOptions,
): Promise<{ total: number; history: BotLaunchHistoryDto[] } | { error: string }> {
  let res: Response;
  try {
    res = await apiFetch(`/api/tokens/${tokenId}/launch-history`, { apiBaseUrl: options?.apiBaseUrl });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: токен не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let arr: RawBotLaunchHistory[];
  try {
    arr = (await res.json()) as RawBotLaunchHistory[];
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  const history: BotLaunchHistoryDto[] = arr.map((h) => ({
    id: h.id,
    status: h.status ?? 'unknown',
    startedAt: h.startedAt ?? null,
    stoppedAt: h.stoppedAt ?? null,
    errorMessage: h.errorMessage ?? null,
    processId: h.processId ?? null,
  }));

  return { total: history.length, history };
}

/**
 * Запускает бота проекта через POST /api/projects/:id/bot/start в живой БД.
 * Серверный эндпоинт сам пишет историю запусков (bot_launch_history) и шлёт
 * WebSocket-broadcast (bot-started), обновляющий UI в реальном времени — здесь
 * НИЧЕГО дополнительно для истории/realtime делать не нужно.
 * ⚠️ Запуск асинхронный (worker pool): успешный ответ означает лишь принятие
 * команды — после успеха рекомендуется проверить состояние через botStatusInDb
 * (db_bot_status). botToken сервер берёт сам по tokenId или по дефолтному токену.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param tokenId - ID токена (опционально; без него сервер берёт дефолтный токен проекта)
 * @param options - Опции запроса (URL API)
 * @returns Признак успеха { ok, message, processId } либо ошибка { error }
 */
export async function startBotInDb(
  projectId: number,
  tokenId?: number,
  options?: ReadDbOptions,
): Promise<{ ok: true; message: string; processId: string | null } | { error: string }> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/bot/start`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenId != null ? { tokenId } : {}),
    });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект не найден${body ? `: ${body}` : ''}` };
    if (res.status === 400) return { error: body ? `HTTP 400: ${body}` : 'HTTP 400' };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: { message?: string; processId?: string | null };
  try {
    body = (await res.json()) as { message?: string; processId?: string | null };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  return { ok: true, message: body.message ?? 'Бот запущен', processId: body.processId ?? null };
}

/**
 * Останавливает бота проекта через POST /api/projects/:id/bot/stop в живой БД.
 * Серверный эндпоинт сам пишет историю запусков (bot_launch_history) и шлёт
 * WebSocket-broadcast (bot-stopped), обновляющий UI в реальном времени — здесь
 * НИЧЕГО дополнительно для истории/realtime делать не нужно.
 * Защита от случайного вызова: confirm-gate первой строкой (останавливает живого
 * бота) — без confirm: true HTTP-запрос не отправляется. tokenId обязателен.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param tokenId - ID токена (обязателен; из db_list_bot_tokens)
 * @param options - Опции запроса: URL API и обязательное подтверждение confirm
 * @returns Признак успеха { ok, message } либо ошибка { error }
 */
export async function stopBotInDb(
  projectId: number,
  tokenId: number,
  options?: ReadDbOptions & { confirm?: boolean },
): Promise<{ ok: true; message: string } | { error: string }> {
  if (options?.confirm !== true) {
    return { error: 'Остановка живого бота. Передайте confirm: true для подтверждения.' };
  }

  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/bot/stop`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId }),
    });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект не найден${body ? `: ${body}` : ''}` };
    if (res.status === 400) return { error: body ? `HTTP 400: ${body}` : 'HTTP 400' };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: { message?: string };
  try {
    body = (await res.json()) as { message?: string };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  return { ok: true, message: body.message ?? 'Бот остановлен' };
}

/**
 * Перезапускает текущий/дефолтный или КОНКРЕТНЫЙ бот проекта через
 * POST /api/projects/:id/bot/restart в живой БД. Если передан tokenId — рестартится
 * именно этот токен (для проектов с несколькими токенами); иначе текущий инстанс +
 * дефолтный токен. Рестарт внутри сервера вызывает те же startBot/stopBot, которые САМИ
 * пишут историю запусков (bot_launch_history) и шлют WebSocket-broadcast,
 * обновляющий UI в реальном времени — здесь НИЧЕГО дополнительно для истории/realtime
 * делать не нужно.
 * ⚠️ Запуск асинхронный: успешный ответ означает лишь принятие команды — после успеха
 * рекомендуется проверить состояние через botStatusInDb (db_bot_status). confirm не
 * требуется: рестарт лишь кратко прерывает бота, который сам поднимается обратно.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param tokenId - ID токена (опционально; без него — текущий/дефолтный бот проекта)
 * @param options - Опции запроса (URL API)
 * @returns Признак успеха { ok, message, processId } либо ошибка { error }
 */
export async function restartBotInDb(
  projectId: number,
  tokenId?: number,
  options?: ReadDbOptions,
): Promise<{ ok: true; message: string; processId: string | null } | { error: string }> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/bot/restart`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenId != null ? { tokenId } : {}),
    });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: ${body || 'экземпляр бота или проект не найден'}` };
    if (res.status === 400) return { error: body ? `HTTP 400: ${body}` : 'HTTP 400' };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: { message?: string; processId?: string | null };
  try {
    body = (await res.json()) as { message?: string; processId?: string | null };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  return { ok: true, message: body.message ?? 'Бот перезапущен', processId: body.processId ?? null };
}

/**
 * Перезапускает ВСЕ запущенные боты проекта через POST /api/projects/:id/bot/restart-all
 * в живой БД. Каждый рестарт внутри сервера вызывает те же startBot/stopBot, которые
 * САМИ пишут историю запусков и шлют WebSocket-broadcast, обновляющий UI в реальном
 * времени — здесь НИЧЕГО дополнительно делать не нужно.
 * Защита от случайного вызова: confirm-gate первой строкой (затрагивает ВСЕ боты
 * проекта — более широкий blast radius) — без confirm: true HTTP-запрос не отправляется.
 * ⚠️ Запуск асинхронный: после успеха рекомендуется проверить состояние через
 * botStatusInDb (db_bot_status). Если запущенных ботов нет — сервер вернёт
 * { message, restarted: 0 } без results (в таком случае results будет []).
 * @param projectId - Числовой ID проекта из URL редактора
 * @param options - Опции запроса: URL API и обязательное подтверждение confirm
 * @returns Сводка { ok, restarted, failed, results, message? } либо ошибка { error }
 */
export async function restartAllBotsInDb(
  projectId: number,
  options?: ReadDbOptions & { confirm?: boolean },
): Promise<
  { ok: true; restarted: number; failed: number; results: unknown[]; message?: string } | { error: string }
> {
  if (options?.confirm !== true) {
    return { error: 'Перезапуск всех ботов проекта. Передайте confirm: true для подтверждения.' };
  }

  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/bot/restart-all`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: ${body || 'токены проекта не найдены'}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: { restarted?: number; failed?: number; results?: unknown[]; message?: string };
  try {
    body = (await res.json()) as { restarted?: number; failed?: number; results?: unknown[]; message?: string };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  return {
    ok: true,
    restarted: body.restarted ?? 0,
    failed: body.failed ?? 0,
    results: body.results ?? [],
    message: body.message,
  };
}
