/** @fileoverview Этапы телефонной авторизации, изолированные по проекту, аккаунту и пользователю. */
import type { ProjectTelegramAccountProxyInput } from '@shared/project-telegram-accounts';
import type { ProjectTelegramSessionInput } from '../../database/project-telegram-account-secrets';
import { ProjectTelegramInputError, telegramApiCredentials, telegramInput } from './input';
import { createProjectPhoneWorker } from './phone-worker';
import { resolveProjectTelegramProxy } from './proxy';
import { validateTelegramStringSession } from './session-format';

/** Временное состояние одной авторизации пользователя. */
interface PhoneAttempt {
  /** Уникальный клиент Telethon, который запросил код. */
  worker: ReturnType<typeof createProjectPhoneWorker>;
  /** Таймер, закрывающий процесс после истечения срока. */
  timeout: ReturnType<typeof setTimeout>;
  /** Номер в международном формате. */
  phone: string;
  /** Идентификатор приложения Telegram. */
  apiId: string;
  /** Ключ приложения Telegram. */
  apiHash: string;
  /** Следующий допустимый этап. */
  stage: 'starting' | 'code' | 'password';
  /** Запрос уже передан процессу. */
  busy: boolean;
}

const attempts = new Map<string, PhoneAttempt>();
const retryMessages: Record<string, string> = {
  invalid_code: 'Неверный код подтверждения.',
  invalid_password: 'Неверный пароль двухэтапной аутентификации.',
};
const messages: Record<string, string> = {
  ...retryMessages,
  code_expired: 'Код истёк. Запросите новый код.',
  flood_wait: 'Telegram временно ограничил число попыток. Повторите позже.',
  timeout: 'Telegram не ответил вовремя. Запросите новый код.',
};

/**
 * Удаляет временное состояние и закрывает его клиент.
 * @param scope - Ключ пользователя, проекта и аккаунта.
 */
function closeAttempt(scope: string) {
  const attempt = attempts.get(scope);
  if (!attempt) return;
  attempts.delete(scope);
  clearTimeout(attempt.timeout);
  attempt.worker.close();
}

/**
 * Отправляет код и сохраняет параметры до следующих этапов.
 * @param scope - Ключ пользователя, проекта и аккаунта.
 * @param raw - Настройки приложения и номер телефона.
 * @param proxy - Настройки исходящего прокси аккаунта.
 * @returns Состояние ожидания кода.
 */
export async function startProjectTelegramPhoneAuth(scope: string, raw: unknown, proxy?: ProjectTelegramAccountProxyInput | null) {
  const { phone: supplied, apiId, apiHash } = telegramInput(raw);
  const phone = typeof supplied === 'string' ? supplied.trim().replace(/[\s()\-]/g, '') : '';
  const credentials = telegramApiCredentials(apiId, apiHash);
  if (!/^\+[1-9]\d{6,14}$/.test(phone)) throw new ProjectTelegramInputError('Укажите телефон в международном формате.');
  const pinned = proxy ? await resolveProjectTelegramProxy(proxy) : undefined;
  if (attempts.get(scope)?.busy) throw new ProjectTelegramInputError('Дождитесь завершения текущего шага.');
  closeAttempt(scope);
  if (attempts.size >= 32) throw new ProjectTelegramInputError('Сервис авторизации занят. Повторите позже.');
  const worker = createProjectPhoneWorker();
  const timeout = setTimeout(() => closeAttempt(scope), 5 * 60_000);
  timeout.unref();
  const attempt: PhoneAttempt = { worker, timeout, phone, ...credentials, stage: 'starting', busy: true };
  attempts.set(scope, attempt);
  const reply = await worker.request('send_code', {
    api_id: attempt.apiId, api_hash: attempt.apiHash, phone,
    proxy: pinned ? { proxy_type: pinned.type, addr: pinned.host, port: pinned.port,
      username: pinned.username, password: pinned.password, rdns: true } : undefined,
  });
  if (!reply?.ok) {
    closeAttempt(scope);
    throw new ProjectTelegramInputError(messages[reply?.error ?? ''] ?? 'Не удалось отправить код Telegram.');
  }
  attempt.busy = false;
  attempt.stage = 'code';
  return { stage: 'code' as const };
}

/**
 * Проверяет код или пароль и возвращает сессию только для записи сервером.
 * @param scope - Ключ пользователя, проекта и аккаунта.
 * @param action - Ожидаемый этап авторизации.
 * @param raw - Код или пароль Telegram.
 * @returns Запрос второго фактора или результат с секретом сессии.
 */
export async function continueProjectTelegramPhoneAuth(scope: string, action: 'code' | 'password', raw: unknown): Promise<
  { /** Требуется второй фактор. */ stage: 'password' } | { /** Вход завершён. */ stage: 'done'; /** Секрет для записи. */ session: ProjectTelegramSessionInput }
> {
  const attempt = attempts.get(scope);
  if (!attempt || attempt.stage !== action || attempt.busy) throw new ProjectTelegramInputError('Шаг недоступен. Проверьте состояние входа.');
  const { code, password } = telegramInput(raw);
  if (action === 'code' && (typeof code !== 'string' || !/^\d{3,8}$/.test(code.trim()))) {
    throw new ProjectTelegramInputError('Введите код подтверждения Telegram.');
  }
  if (action === 'password' && (typeof password !== 'string' || password.length === 0 || password.length > 1024)) {
    throw new ProjectTelegramInputError('Введите пароль двухэтапной аутентификации.');
  }
  attempt.busy = true;
  const reply = await attempt.worker.request(action === 'code' ? 'sign_in' : 'sign_in_2fa', {
    include_identity: true, phone: attempt.phone, code: typeof code === 'string' ? code.trim() : undefined, password,
  });
  if (attempts.get(scope) !== attempt) throw new ProjectTelegramInputError('Время авторизации истекло. Запросите новый код.');
  if (!reply?.ok) {
    attempt.busy = false;
    if (!retryMessages[reply?.error ?? '']) closeAttempt(scope);
    throw new ProjectTelegramInputError(messages[reply?.error ?? ''] ?? 'Не удалось завершить вход в Telegram.');
  }
  if (action === 'code' && reply.needs_2fa) {
    attempt.stage = 'password';
    attempt.busy = false;
    return { stage: 'password' };
  }
  /** Прерываем временное соединение до передачи сессии общему клиенту. */
  const disconnected = await attempt.worker.request('disconnect', {});
  if (attempts.get(scope) !== attempt) throw new ProjectTelegramInputError('Время авторизации истекло. Запросите новый код.');
  closeAttempt(scope);
  if (!disconnected?.ok) throw new ProjectTelegramInputError('Не удалось завершить временное подключение Telegram.');
  return { stage: 'done', session: {
    apiId: attempt.apiId, apiHash: attempt.apiHash, phone: attempt.phone, sessionKind: 'phone',
    sessionString: validateTelegramStringSession(reply.session_string), telegramUserId: reply.telegram_user_id,
    telegramName: reply.telegram_name || undefined, telegramUsername: reply.telegram_username || undefined,
  } };
}
