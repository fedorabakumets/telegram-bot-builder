/**
 * @fileoverview Диагностика соединения с Telegram без передачи токена.
 */
import type { Request, Response } from 'express';
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
  if (text.includes('прокси') || text.includes('режим подключения')) return entries[0].replace(/^Error\s*/, '');
  return 'Не удалось установить соединение. Проверьте сеть и настройки подключения.';
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
    const connection = getTelegramConnection(values);
    method = connection.proxy ? 'Через прокси' : 'Напрямую';
    agent = !connection.proxy ? new Agent() : /^socks5h?:/i.test(connection.proxy) ? createTelegramSocksAgent(connection.proxy) : new ProxyAgent(connection.proxy);
    const response = await undiciFetch('https://api.telegram.org/', { signal: AbortSignal.timeout(10000), redirect: 'manual', dispatcher: agent });
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
