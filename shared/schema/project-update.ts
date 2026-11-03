/**
 * @fileoverview Разрешённые поля общего обновления проекта без изменения владельца и секретов.
 */
import { insertBotProjectSchema } from './tables/bot-projects';
/** Общий маршрут не выдаёт полномочия и не меняет секреты или администраторов. */
export const updateBotProjectSchema = insertBotProjectSchema.pick({
  name: true, description: true, data: true, userDatabaseEnabled: true,
  sortOrder: true, restartOnUpdate: true,
}).partial();
/** Запрещённые поля обслуживаются отдельными маршрутами с дополнительной авторизацией. */
export const privilegedProjectFields = ['ownerId', 'sessionId', 'botToken', 'adminIds',
 'lastExportedGoogleSheetId', 'lastExportedGoogleSheetUrl', 'lastExportedAt',
 'lastExportedStructureSheetId', 'lastExportedStructureSheetUrl', 'lastExportedStructureAt', 'revision', 'id', 'createdAt', 'updatedAt'] as const;
