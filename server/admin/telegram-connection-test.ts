/**
 * @fileoverview Диагностика соединения с Telegram без передачи токена.
 */
import type { Request, Response } from 'express';
import { getTelegramApiBaseUrl, OFFICIAL_TELEGRAM_API } from '../utils/telegram-api-url';
import { getTelegramConnection } from '../utils/telegram-connection';
import { Agent, ProxyAgent, fetch as undiciFetch } from 'undici';
import { createTelegramSocksAgent } from '../utils/telegram-socks-agent';

/**
 * Объясняет сетевую ошибку без раскрытия адресов и секретов.
 * @param error - Ошибка соединения
 * @returns Сообщение для пользователя
 */
export function describeTelegramError(error: unknown): string {
  const entries: string[] = [];
  let current: any = error;
  for (let i = 0; current && i < 5; i++, current = current.cause) entries.push(`${current.name ?? ''} ${current.code ?? ''} ${current.message ?? ''}`);
  const text = entries.join(' ').toLowerCase();
  if (text.includes('407') || text.includes('proxy authentication') || text.includes('socks5 authentication failed') || text.includes('no accepted authentication type')) return 'Прокси требует авторизацию. Проверьте имя пользователя и пароль.';
  if (text.includes('enotfound') || text.includes('eai_again')) return 'Ошибка DNS. Не удалось определить адрес сервера.';
  if (text.includes('timeout') || text.includes('timedout') || text.includes('etimedout')) return 'Превышено время ожидания соединения.';
  if (text.includes('econnrefused') || text.includes('socks5 proxy rejected')) return 'Соединение отклонено. Проверьте доступность сервера или прокси.';
  if (text.includes('прокси') || text.includes('режим подключения') || text.includes('bot api')) return entries[0].replace(/^Error\s*/, '');
  return 'Не удалось установить соединение. Проверьте сеть и настройки подключения.';
}

/**
 * Распознаёт ответ локального Bot API на заведомо неверный токен.
 * @param status - Код ответа
 * @param data - Тело ответа
 * @returns Признак ожидаемого ответа Telegram Bot API
 */
export function isLocalTelegramResponse(status: number, data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const body = data as Record<string, unknown>;
  return status === 401 && body.ok === false && body.error_code === 401 && typeof body.description === 'string' && body.description.toLowerCase().includes('invalid token');
}

/**
 * Проверяет доступ к Telegram API с текущими значениями формы.
 * @param req - Запрос администратора
 * @param res - Результат проверки
 */
export async function handleTestTelegramConnection(req: Request, res: Response): Promise<void> {
  let method = 'Не определён';
  let agent: Agent | ProxyAgent | undefined;
  try {
    const values = req.body?.values;
    if (values && (typeof values.mode !== 'string' || typeof values.proxy !== 'string')) throw new Error('Некорректные настройки прокси');
    if (values && (typeof values.apiMode !== 'string' || typeof values.apiUrl !== 'string')) throw new Error('Некорректные настройки Bot API');
    const baseUrl = getTelegramApiBaseUrl(values);
    const connection = baseUrl === OFFICIAL_TELEGRAM_API ? getTelegramConnection(values) : { proxy: undefined };
    method = connection.proxy ? 'Через прокси' : 'Напрямую';
    agent = !connection.proxy ? new Agent() : /^socks5h?:/i.test(connection.proxy) ? createTelegramSocksAgent(connection.proxy) : new ProxyAgent(connection.proxy);
    const local = baseUrl !== OFFICIAL_TELEGRAM_API;
    const response = await undiciFetch(`${baseUrl}${local ? '/bot0:invalid/getMe' : '/'}`, { signal: AbortSignal.timeout(10000), redirect: 'manual', dispatcher: agent });
    if (local) {
      const data = await response.json().catch(() => null);
      if (!isLocalTelegramResponse(response.status, data)) {
        res.json({ ok: false, method, message: `Сервер ответил HTTP ${response.status}, но не подтвердил, что это Telegram Bot API.` });
        return;
      }
      res.json({ ok: true, method, message: 'Локальный Telegram Bot API ответил. Токен бота и связь сервера с Telegram не проверялись.' });
      return;
    }
    await response.body?.cancel();
    if (response.status >= 400 && response.status !== 404) {
      res.json({ ok: false, method, message: `Telegram API вернул HTTP ${response.status}. Токен бота не проверялся.` });
      return;
    }
    res.json({ ok: true, method, message: `Telegram API доступен (HTTP ${response.status}). Токен бота не проверялся.` });
  } catch (error) {
    res.json({ ok: false, method, message: describeTelegramError(error) });
  } finally {
    await agent?.close();
  }
}
