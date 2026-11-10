/** @fileoverview Совместимые контракты семи HTTP-записей таблиц с постоянной квитанцией requestId. */
import '../../server/swagger/schemas/common';
import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { actionRequestIdSchema } from '../../shared/action-request-id';
import { ProjectPersistenceSchema, TablePersistenceSchema } from '../../server/swagger/schemas/persistence';
import { MessageErrorSchema } from '../../server/swagger/schemas/common';

/** Подтверждение записи таблицы либо пакета таблиц, где общего tableId нет. */
const persistence = ProjectPersistenceSchema.extend({ /** Таблица, если известна. */ tableId: z.number().optional() });
/** Ответ durableTableWrite после записи квитанции, без содержимого и имён ячеек. */
export const TableCompletedReceiptSchema = z.object({
  /** UUID логического запроса. */ requestId: actionRequestIdSchema,
  /** Квитанция сохранена; это не подтверждение live-доставки. */ state: z.literal('completed'),
  /** Только идентификаторы, максимум 500. */ receipt: z.object({
    /** Идентификаторы разных сущностей без повторов. */ ids: z.array(z.number().int().positive()).max(500),
    /** Собранный список был длиннее 500 до удаления повторов. */ idsTruncated: z.boolean(),
  }),
  /** Подтверждение БД, если конечный обработчик его вернул. */ persistence: persistence.optional(),
}).openapi('TableCompletedReceipt');
/** Неопределённый исход запрещает автоматическое повторное выполнение. */
export const TableUnknownReceiptSchema = z.object({
  /** UUID исходной попытки. */ requestId: actionRequestIdSchema,
  /** Требуется сверка результата. */ state: z.literal('unknown'),
  /** Повторное выполнение автоматически запрещено. */ retryable: z.literal(false),
  /** Частичная квитанция либо отсутствие сведений. */ receipt: TableCompletedReceiptSchema.nullable(),
  /** Пояснение необходимости сверки. */ message: z.string(),
}).openapi('TableUnknownReceipt');
/** Фактические POST-маршруты durableTableWrite; список проверяется отдельным тестом. */
export const DURABLE_TABLE_PATHS = [
  '/api/projects/{id}/tables', '/api/projects/{id}/tables/{tableId}/columns',
  '/api/projects/{id}/tables/{tableId}/rows', '/api/projects/{id}/tables/{tableId}/rows/import',
  '/api/projects/{id}/tables/{tableId}/apply-ops', '/api/projects/{id}/tables/{tableId}/cells/edit',
  '/api/projects/{id}/tables/import',
] as const;

/**
 * Дополняет реальные регистрации, не создавая второй набор схем операций.
 * @param registry - Общий реестр контрактов после регистрации маршрутов.
 * @returns Ничего; изменяются только описания контрактов, не HTTP-обработчики.
 */
export function applyDurableTableContracts(registry: OpenAPIRegistry): void {
  for (const definition of registry.definitions) {
    if (definition.type !== 'route' || definition.route.method !== 'post' || !DURABLE_TABLE_PATHS.includes(definition.route.path as typeof DURABLE_TABLE_PATHS[number])) continue;
    const route = definition.route;
    const body = route.request?.body?.content['application/json'];
    /** Ссылка OpenAPI не содержит локальной схемы и не может дополняться пересечением Zod. */
    if (!body || '$ref' in body || !(body.schema instanceof z.ZodType)) throw new Error(`Отсутствует общая Zod-схема тела: ${route.path}`);
    body.schema = body.schema.and(z.object({ /** Необязательный UUID одной записи. */ requestId: actionRequestIdSchema.optional() }));
    route.description = `${route.description ?? ''}\n\nБез requestId сохраняется прежний формат ответа. Объект дополнен persistence; массив подтверждается JSON-заголовком x-botcraft-persistence. С requestId возвращается только квитанция IDs: повтор того же UUID и аргументов не выполняет запись снова. 202 unknown требует сверки, автоматический повтор запрещён. 409 означает повтор UUID с другими аргументами.`;
    for (const [status, response] of Object.entries(route.responses)) {
      if (!/^2/.test(status) || '$ref' in response) continue;
      const json = response.content?.['application/json'];
      /** Для успешного результата требуется локальная схема; ссылку оставляем ошибкой контракта. */
      if (!json || '$ref' in json || !(json.schema instanceof z.ZodType)) throw new Error(`Отсутствует Zod-схема результата: ${route.path}`);
      const legacyPersistence = route.path.endsWith('/tables/import') ? ProjectPersistenceSchema : TablePersistenceSchema;
      const legacy = json.schema instanceof z.ZodObject ? json.schema.extend({ /** Доказательство записи. */ persistence: legacyPersistence }) : json.schema;
      json.schema = z.union([legacy, TableCompletedReceiptSchema]);
      if (json.example && typeof json.example === 'object' && !Array.isArray(json.example)) {
        json.example = { ...json.example, persistence: { confirmed: true, projectId: 42, ...(route.path.endsWith('/tables/import') ? {} : { tableId: 1 }) } };
      }
      response.description += ' Без requestId — совместимый результат; с requestId — TableCompletedReceipt.';
      if (legacy instanceof z.ZodArray) response.headers = { 'x-botcraft-persistence': { description: 'JSON {confirmed:true,projectId,tableId?}; legacy массивы сохраняют форму. При 202 заголовок удалён.', schema: { type: 'string' } } };
    }
    route.responses[202] = { description: 'Исход требует сверки; не выполнять повтор автоматически', content: { 'application/json': { schema: TableUnknownReceiptSchema } } };
    route.responses[409] = { description: 'UUID уже использован с другими аргументами либо конфликт создания', content: { 'application/json': { schema: MessageErrorSchema } } };
    route.responses[503] = { description: 'Журнал заявок недоступен; действие не выполнялось', content: { 'application/json': { schema: MessageErrorSchema } } };
    for (const [status, response] of Object.entries(route.responses)) {
      if (Number(status) < 400 || '$ref' in response) continue;
      const json = response.content?.['application/json'];
      /** Ссылочные ошибки сохраняются без изменений, как и ошибки без объектной Zod-схемы. */
      if (json && !('$ref' in json) && json.schema instanceof z.ZodObject) json.schema = json.schema.extend({ /** UUID, если ошибка оформлена сохранённой квитанцией. */ requestId: actionRequestIdSchema.optional() });
    }
  }
}
