/**
 * @fileoverview Ограниченный по времени резолв username бота через Telegram getMe.
 * @module server/services/telegram-bot-username
 */
import { getTelegramApiBaseUrl } from '../utils/telegram-api-url';
import { fetchWithProxy } from '../utils/telegram-proxy';

/** Ответ Telegram API getMe. */
interface TelegramGetMeResult {
  /** Успех запроса. */
  ok?: boolean;
  /** Данные бота. */
  result?: {
    /** Публичное имя бота. */
    username?: string;
  };
}

/** Запись ограниченного кэша результатов и выполняющихся запросов. */
interface UsernameEntry {
  /** Общий результат параллельных обращений. */
  promise: Promise<string | undefined>;
  /** Время истечения записи после завершения запроса. */
  expiresAt: number;
  /** Подтверждённый HTTP 401 сохраняется до вытеснения записи или замены токена. */
  unauthorized?: boolean;
}

/** Максимальное число сохраняемых токенов, включая выполняющиеся запросы. */
const MAX_ENTRIES = 100;
/** Кэш хранится только в памяти и никогда не выводится в журнал. */
const entries = new Map<string, UsernameEntry>();

/**
 * Запрашивает имя с ограничением всей операции, включая чтение тела ответа.
 * @param token - Токен Telegram
 * @param onUnauthorized - Фиксирует подтверждённый отказ авторизации
 * @returns Имя без @ либо undefined при недоступности Telegram
 */
async function requestUsername(token: string, onUnauthorized: () => void): Promise<string | undefined> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<undefined>((resolve) => {
      timer = setTimeout(() => { controller.abort(); resolve(undefined); }, 5_000);
    });
    const request = (async () => {
      const response = await fetchWithProxy(
        `${getTelegramApiBaseUrl()}/bot${token}/getMe`,
        { signal: controller.signal },
      );
      if (response.status === 401) { onUnauthorized(); return undefined; }
      const data = await response.json() as TelegramGetMeResult;
      if (!response.ok || !data.ok || typeof data.result?.username !== 'string') return undefined;
      return data.result.username.replace(/^@/, '') || undefined;
    })();
    return await Promise.race([request, deadline]);
  } catch {
    // Ошибка транспорта может содержать токен в URL, поэтому её не журналируем.
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Получает username, объединяя параллельные запросы для одного токена.
 * @param botToken - Токен бота
 * @returns Username без @ либо undefined; сбои повторно проверяются через 10 секунд
 */
export async function fetchBotUsernameFromToken(botToken: string): Promise<string | undefined> {
  const token = botToken.trim();
  if (!token) return undefined;
  const cached = entries.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  entries.delete(token);
  if (entries.size >= MAX_ENTRIES) {
    entries.delete(entries.keys().next().value!);
  }
  const entry: UsernameEntry = { promise: Promise.resolve(undefined), expiresAt: Infinity };
  entry.promise = requestUsername(token, () => { entry.unauthorized = true; }).then((username) => {
    entry.expiresAt = entry.unauthorized ? Infinity : Date.now() + (username ? 300_000 : 10_000);
    return username;
  });
  entries.set(token, entry);
  return entry.promise;
}
