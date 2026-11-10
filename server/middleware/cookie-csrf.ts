/** @fileoverview Защита изменяющих запросов с пользовательской или административной cookie от CSRF. */
import type { Request, Response, NextFunction } from 'express';
import { isAdminAuthenticated } from '../admin/admin-auth-middleware';

/** Методы, которые не должны изменять состояние приложения. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
/** Независимо авторизуемые машинные маршруты: подпись агента или токен runtime. */
const MACHINE_PATHS = new Set([
  '/api/auth/agent/telegram', '/api/auth/agent/disconnect',
  '/api/runtime/media', '/api/runtime/media/incoming-photo', '/api/runtime/media/invoice-link',
]);

/**
 * Определяет маршруты интеграций, которые не используют браузерную сессию для авторизации.
 * @param path - Полный путь запроса без строки параметров
 * @returns Признак webhook, hook или явно перечисленного машинного маршрута
 */
function isMachinePath(path: string): boolean {
  return MACHINE_PATHS.has(path)
    || /^\/api\/webhook\/\d+\/\d+\/?$/.test(path)
    || /^\/api\/hooks\/\d+(?:\/|$)/.test(path);
}

/**
 * Проверяет наличие действующей административной cookie без исключений на испорченном заголовке.
 * @param req - Запрос Express
 * @returns Признак действующей административной cookie
 */
function hasAdminSession(req: Request): boolean {
  if (!/(?:^|;\s*)admin_auth=/.test(req.get('Cookie') || '')) return false;
  try { return isAdminAuthenticated(req); } catch { return false; }
}

/**
 * Сравнивает источник с публичным адресом запроса, сохраняя схему и порт.
 * @param source - Значение Origin или Referer
 * @param expected - Публичный адрес из протокола Express и исходного Host
 * @param originHeader - Требуется ли точное значение Origin без пути
 * @returns Признак совпадения источника
 */
function matchesOrigin(source: string, expected: string, originHeader: boolean): boolean {
  try {
    const url = new URL(source);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      && url.origin === new URL(expected).origin && (!originHeader || source === url.origin);
  } catch { return false; }
}

/**
 * Разрешает изменение через cookie только с доверенным источником или непростым запросом CLI.
 * SameSite=None сохраняется для Mini App. Host берётся напрямую, не из X-Forwarded-Host.
 * Без Origin/Referer браузерная metadata требует отказа; CLI может отправить JSON или
 * X-Botcraft-CSRF: 1. Такие запросы из чужого браузерного origin требуют CORS preflight,
 * а приложение не разрешает credentialed CORS. Наличие Authorization не отменяет проверку cookie.
 * @param req - Запрос Express после подключения express-session
 * @param res - Ответ Express
 * @param next - Следующий обработчик
 * @returns Ничего; при отказе отвечает 403 без раскрытия содержимого запроса
 */
export function cookieCsrf(req: Request, res: Response, next: NextFunction): void {
  const path = req.originalUrl.split('?')[0];
  if (SAFE_METHODS.has(req.method) || isMachinePath(path)
    || (!req.session?.telegramUser && !hasAdminSession(req))) { next(); return; }
  const expected = `${req.protocol}://${req.get('host')}`;
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  // Node fetch сам выставляет Sec-Fetch-Mode: cors, поэтому один этот заголовок не означает браузер.
  const hasBrowserMetadata = ['sec-fetch-site', 'sec-fetch-dest', 'sec-fetch-user']
    .some((name) => req.get(name) !== undefined);
  const allowed = origin !== undefined ? matchesOrigin(origin, expected, true)
    : referer !== undefined ? matchesOrigin(referer, expected, false)
      : !hasBrowserMetadata && (Boolean(req.is('application/json')) || req.get('X-Botcraft-CSRF') === '1');
  if (!allowed) { res.status(403).json({ error: 'CSRF_ORIGIN_MISMATCH' }); return; }
  next();
}
