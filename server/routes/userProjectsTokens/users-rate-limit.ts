/** @fileoverview Общие ограничения маршрутов пользователей бота по IP и подтверждённому владельцу. */
import type { Request } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { getOwnerIdFromRequest } from '../../telegram/auth-middleware';
import { UsersRateLimitStore } from './users-rate-limit-store';

/** Вычисляет квоту по авторизованному владельцу, включая запросы с правом impersonation.
 * @param req - Запрос после аутентификации и проверки актора.
 * @returns Ключ владельца, не зависящий от query telegram_id.
 */
export function botUsersPrincipalKey(req: Request): string {
  return `owner:${getOwnerIdFromRequest(req) ?? 'unauthenticated'}`;
}

/** Создаёт штатный ограничитель с единым контрактом ответа.
 * @param scope - Вид квоты.
 * @param limit - Число запросов за минуту.
 * @param keyGenerator - Получение доверенного идентификатора.
 * @returns Middleware ограничения запросов.
 */
export function createBotUsersRateLimit(scope: string, limit: number, keyGenerator: (req: Request) => string) {
  return rateLimit({
    windowMs: 60_000, limit, keyGenerator,
    store: new UsersRateLimitStore(scope),
    standardHeaders: 'draft-7', legacyHeaders: false,
    requestPropertyName: `botUsersLimit_${scope}`,
    handler: (_req, res) => {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED', code: 'BOT_USERS_RATE_LIMITED',
        message: 'Слишком много запросов к пользователям бота. Повторите позже.',
      });
    },
  });
}

/** Предварительная общая квота IP защищает проверку актора; IPv6 объединяется по /56. */
export const botUsersIpRateLimit = createBotUsersRateLimit('ip', 600,
  (req) => ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown', 56));

/** Общая квота владельца действует на список и карточку пользователя после проверки актора. */
export const botUsersActorRateLimit = createBotUsersRateLimit('actor', 120, botUsersPrincipalKey);
