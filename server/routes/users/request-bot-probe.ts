/** @fileoverview Ограниченные повторные запросы проверки бота при временном сбое соединения. */
import { fetchWithProxy } from '../../utils/telegram-proxy';
import { getTelegramApiBaseUrl } from '../../utils/telegram-api-url';
/** Тайм-аут одной попытки, включая чтение тела ответа. */
export const BOT_PROBE_TIMEOUT_MS = 15_000;
/** Выполняет максимум две попытки; подтверждённые отказы Telegram не повторяет. @param token - Секрет бота. @param method - Проверяемый метод. @param commands - Прежние команды при сохранении. @returns Ответ и разобранное тело либо исключение транспорта. */
export async function requestBotProbe(token: string, method: string, commands?: unknown) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetchWithProxy(`${getTelegramApiBaseUrl()}/bot${token}/${method}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commands === undefined ? {} : { commands }),
        signal: AbortSignal.timeout(BOT_PROBE_TIMEOUT_MS),
      });
      const body = await response.json();
      if (response.status >= 500 && attempt === 0) continue;
      return { response, body };
    } catch (error) { if (attempt === 1) throw error; }
  }
  throw new Error('Проверка не завершена');
}
