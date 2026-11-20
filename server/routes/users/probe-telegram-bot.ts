/** @fileoverview Проверка личности и заморозки через чтение и сохранение прежних команд без личных чатов. */
import { requestBotProbe } from './request-bot-probe';
import type { TelegramBotCheckItem } from '@shared/telegram-bot-check';
/** Проверенная причина недоступности; error означает неопределённый результат. */
export type TelegramBotProbe = 'available' | 'unauthorized' | 'bot_deactivated' | 'telegram_frozen'
  | 'no_test_chat' | 'chat_unavailable' | 'rate_limited' | 'error';
/**
 * Проверяет разрешение действия, не принимая действительный токен за отсутствие заморозки.
 * @param token - Секрет токена, не возвращается и не логируется.
 * @param report - Принимает только безопасные подробности ответа без URL и токена.
 * @returns Только подтверждённый результат Telegram либо неопределённость.
 */
export async function probeTelegramBot(token: string, report: (detail: Pick<TelegramBotCheckItem, 'reason' | 'method' | 'errorCode'>) => void = () => {}) : Promise<TelegramBotProbe> {
  let currentMethod = 'getMe';
  /** Различает тайм-аут и сетевой сбой, не раскрывая текст исключения с URL. */
  function transportError(error: unknown) {
    report({ method: currentMethod, reason: error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name) ? 'timeout' : 'network' });
    return null;
  }
  try {
    report({ method: currentMethod });
    let reply = await requestBotProbe(token, currentMethod).catch(transportError);
    if (!reply) return 'error';
    let { response, body } = reply;
    if (response.ok && body?.ok === true && body.result?.is_bot === true
      && String(body.result.id) === token.split(':')[0]) {
      /** Читаем только область по умолчанию, затем записываем точно тот же список. */
      for (const method of ['getMyCommands', 'setMyCommands']) {
        currentMethod = method;
        report({ method });
        const commands = method === 'setMyCommands' ? body.result : undefined;
        reply = await requestBotProbe(token, method, commands).catch(transportError);
        if (!reply) return 'error';
        ({ response, body } = reply);
        if (!response.ok || body?.ok !== true) break;
        if (method === 'setMyCommands') return body.result === true ? 'available' : 'error';
        if (!Array.isArray(body.result) || body.result.length > 100) return 'error';
      }
    }
    if (body?.ok !== false) { report({ method: currentMethod, reason: 'invalid_response' }); return 'error'; }
    report({ method: currentMethod, reason: 'telegram_error', errorCode: body.error_code ?? response.status });
    if (response.status === 401 && body.error_code === 401) return 'unauthorized';
    const text = typeof body.description === 'string' ? body.description.toLowerCase() : '';
    if (response.status === 429) return 'rate_limited';
    if (text.includes('peer_id_invalid') || text.includes('chat not found') || text.includes('bot was blocked by the user')
      || text.includes('user is deactivated')) return 'chat_unavailable';
    if ([400, 420].includes(response.status) && /^(bad request: )?frozen_method_invalid$/.test(text)) return 'telegram_frozen';
    if (response.status === 403 && (text.includes('bot is deactivated') || text.includes('bot was deactivated')
      || text.includes('bot is banned'))) return 'bot_deactivated';
    return 'error';
  } catch { return 'error'; }
}
