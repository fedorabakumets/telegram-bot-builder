/**
 * @fileoverview Разрешённые поля общего обновления проекта без изменения владельца и секретов.
 */
import { insertBotProjectSchema } from './tables/bot-projects';
/** Общий маршрут не выдаёт полномочия и не меняет секреты или администраторов. */
export const updateBotProjectSchema = insertBotProjectSchema.pick({
  name: true, description: true, data: true, userDatabaseEnabled: true,
  sortOrder: true, restartOnUpdate: true,
}).extend({
  /** Отсутствующее поле сохраняет текущую настройку базы проекта. */
  userDatabaseEnabled: insertBotProjectSchema.shape.userDatabaseEnabled.removeDefault(),
  /** Сохранение сценария или имени не меняет порядок проекта. */
  sortOrder: insertBotProjectSchema.shape.sortOrder.unwrap().removeDefault(),
  /** Перезапуск выполняется только по явному запросу. */
  restartOnUpdate: insertBotProjectSchema.shape.restartOnUpdate.unwrap().removeDefault(),
}).partial();
/** Запрещённые поля обслуживаются отдельными маршрутами с дополнительной авторизацией. */
export const privilegedProjectFields = ['ownerId', 'sessionId', 'botToken', 'adminIds', 'defaultLaunchMode',
 'defaultSleepMode', 'defaultAutoRestart', 'defaultMaxRestartAttempts', 'botSettingDefaults',
 'lastExportedGoogleSheetId', 'lastExportedGoogleSheetUrl', 'lastExportedAt',
 'lastExportedStructureSheetId', 'lastExportedStructureSheetUrl', 'lastExportedStructureAt', 'revision', 'id', 'createdAt', 'updatedAt'] as const;
