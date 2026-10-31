/** @fileoverview Контракт доверенного обмена Telegram ID на персональный доступ. */
import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

/** Ошибка без секретов запроса. */
const error = z.object({ error: z.string() });
/** Ответ об успешном изменении состояния. */
const success = z.object({ success: z.literal(true) });
/** Формирует описание JSON-ответа. */
const json = (description: string, schema: z.ZodTypeAny) => ({ description, content: { 'application/json': { schema } } });

/** Регистрирует серверные маршруты; эти теги исключены из инструментов MCP. */
export function registerAgentAutoAuthPaths(registry: OpenAPIRegistry): void {
  const headers = z.object({
    'X-Agent-Id': z.string().describe('Идентификатор доверенного агента'),
    'X-Agent-Timestamp': z.string().regex(/^\d{10}$/).describe('Unix timestamp, допуск 60 секунд'),
    'X-Agent-Nonce': z.string().regex(/^[a-f0-9]{32}$/).describe('16 случайных байт hex; хранится в Redis 120 секунд'),
    'X-Agent-Signature': z.string().regex(/^[a-f0-9]{64}$/).describe('HMAC-SHA256, lowercase hex'),
  });
  const identity = z.object({ id: z.number().int().positive().safe(), firstName: z.string().min(1).max(256),
    lastName: z.string().max(256).optional(), username: z.string().max(64).optional() }).strict();
  const errors = { 400: json('INVALID_REQUEST', error), 401: json('UNAUTHORIZED: подпись или время', error),
    403: json('CONNECTION_REVOKED или AUTO_AUTH_NOT_ALLOWED', error), 409: json('REPLAY_DETECTED', error),
    429: json('RATE_LIMITED', error), 503: json('AUTO_AUTH_UNAVAILABLE: ключ, Redis или БД недоступны', error) };
  for (const action of ['telegram', 'disconnect'] as const) {
    registry.registerPath({ method: 'post', path: `/api/auth/agent/${action}`, tags: ['agent-auto-auth'],
      summary: action === 'telegram' ? 'Доверенный обмен Telegram ID на PAT' : 'Отключить доступ доверенного агента',
      description: 'Только сервер агента. Конструктор доверяет удостоверению отправителя этим сервером. ' +
        'HMAC-SHA256 подписывает METHOD + LF + PATH + LF + TIMESTAMP + LF + NONCE + LF + SHA256(raw body). ' +
        'Лимиты: 10/мин на пользователя, 300/мин на агента, 20 неверных подписей/мин на IP. ' +
        'PAT: read,write, без bot_manager, 24 часа, обновление за 5 минут; старый PAT доживает свой срок. ' +
        'Отключение отзывает все связанные PAT. Восстановление только браузерной сессией владельца. ' +
        'Не является инструментом MCP. Ответ Cache-Control: no-store.', security: [],
      request: { headers, body: { required: true, content: { 'application/json': {
        schema: action === 'telegram' ? identity : identity.pick({ id: true }),
      } } } },
      responses: { ...errors, 200: { ...json('Успех', action === 'disconnect' ? success : z.object({
        token: z.string(), expiresAt: z.string().datetime(), connectionId: z.number().int(), ownerId: z.number().int(),
      })), headers: { 'Cache-Control': { schema: { type: 'string', enum: ['no-store'] } } } } },
    });
  }
  registry.registerPath({ method: 'get', path: '/api/agent-connections', tags: ['agent-connections'], security: [{ cookieAuth: [] }],
    summary: 'Подключения владельца браузерной сессии', description: 'PAT не заменяет браузерную сессию.',
    responses: { 200: json('Подключения без секретов', z.array(z.object({ id: z.number().int(), agentId: z.string(),
      enabled: z.boolean(), createdAt: z.string().datetime(), updatedAt: z.string().datetime() }))),
    401: json('SESSION_REQUIRED', error), 503: errors[503] },
  });
  registry.registerPath({ method: 'patch', path: '/api/agent-connections/{id}', tags: ['agent-connections'], security: [{ cookieAuth: [] }],
    summary: 'Отключить или явно восстановить своё подключение',
    description: 'Только браузерная сессия владельца и совпадающий Origin. Отключение отзывает все PAT. Включение не восстанавливает старые PAT.',
    request: { params: z.object({ id: z.string() }), headers: z.object({ Origin: z.string().url() }),
      body: { required: true, content: { 'application/json': { schema: z.object({ enabled: z.boolean() }).strict() } } } },
    responses: { 200: json('Состояние сохранено', success), 400: errors[400], 401: json('SESSION_REQUIRED', error),
      403: json('ORIGIN_MISMATCH', error), 404: json('NOT_FOUND: чужое или отсутствующее подключение', error), 503: errors[503] },
  });
}
