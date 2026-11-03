/** @fileoverview Ответы административного проекта и безопасного журнала; существующий секретный маршрут остаётся административным. */
import './common';
import { z } from 'zod';
import { BotProjectSchema } from './projects';
/** Полная административная запись проекта с полями экспорта. */
const project = BotProjectSchema.extend({
  /** Описание полной записи проекта. */
  description: z.string().nullable(),
  /** Устаревшее поле токена из записи; значение не приводится в примерах. */
  botToken: z.string().nullable(),
  /** Гостевая сессия, если проект создан гостем. */
  sessionId: z.string().nullable(),
  /** Дата создания в JSON-ответе. */
  createdAt: z.string().nullable(),
  /** Дата изменения в JSON-ответе. */
  updatedAt: z.string().nullable(),
  /** Ревизия сценария. */
  revision: z.number().int(),
  /** Режим базы пользователей. */
  userDatabaseEnabled: z.number().nullable(),
  /** Порядок сортировки. */
  sortOrder: z.number().nullable(),
  /** Администраторы бота. */
  adminIds: z.string().nullable(),
  /** Идентификатор экспорта пользователей. */
  lastExportedGoogleSheetId: z.string().nullable(),
  /** Ссылка экспорта пользователей. */
  lastExportedGoogleSheetUrl: z.string().nullable(),
  /** Дата экспорта пользователей. */
  lastExportedAt: z.string().nullable(),
  /** Идентификатор экспорта структуры. */
  lastExportedStructureSheetId: z.string().nullable(),
  /** Ссылка экспорта структуры. */
  lastExportedStructureSheetUrl: z.string().nullable(),
  /** Дата экспорта структуры. */
  lastExportedStructureAt: z.string().nullable(),
});
/** Безопасная проекция владельца. */
const owner = z.object({
  /** Идентификатор Telegram. */
  id: z.number(),
  /** Имя Telegram. */
  username: z.string().nullable(),
  /** Имя владельца. */
  firstName: z.string(),
  /** Фамилия владельца. */
  lastName: z.string().nullable(),
});
/** Проект и владелец либо null. */
export const AdminProjectResponseSchema = z.object({ adminMode: z.literal(true), project, owner: owner.nullable() });
/** Запись журнала без тела и секретов. */
export const AdminAuditEntrySchema = z.object({
  /** Идентификатор записи. */
  id: z.number(),
  /** Проект записи. */
  projectId: z.number().nullable(),
  /** Владелец проекта. */
  ownerId: z.number().nullable(),
  /** Название действия. */
  action: z.string(),
  /** Метод запроса. */
  method: z.string(),
  /** Путь без query. */
  path: z.string(),
  /** Код ответа. */
  statusCode: z.number().int(),
  /** IP администратора. */
  ip: z.string().nullable(),
  /** Время ISO. */
  createdAt: z.string().datetime(),
});
/** Пустой журнал допустим и для отсутствующего проекта. */
export const AdminAuditResponseSchema = z.object({ items: z.array(AdminAuditEntrySchema) });
/** Явное административное раскрытие без примера секретного значения. */
export const AdminTokenSecretSchema = z.object({
  /** Секретное значение, не предназначенное для MCP и логов. */
  token: z.string().openapi({ description: 'Секретный токен; не сохранять в документации и логах' }),
  /** Идентификатор токена. */
  tokenId: z.number().int(),
});
/** Ошибка обработчиков проекта и токена. */
export const AdminMessageErrorSchema = z.object({ message: z.string() });
/** Ошибка журнала и авторизации. */
export const AdminErrorSchema = z.object({ error: z.string() });
