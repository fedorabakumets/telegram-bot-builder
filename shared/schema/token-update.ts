/**
 * @fileoverview Разрешённые поля обычного редактирования токена без переноса владельца или проекта.
 */
import { insertBotTokenSchema } from './tables/bot-tokens';
/** Профиль, служебные поля, доступ и настройки userbot меняются отдельными маршрутами. */
export const updateBotTokenSchema = insertBotTokenSchema
  .pick({ token: true, name: true, description: true, isDefault: true, isActive: true })
  .extend({
    /** PATCH не назначает токен основным, если флаг не передан. */
    isDefault: insertBotTokenSchema.shape.isDefault.removeDefault(),
    /** PATCH не включает отключённого бота при переименовании или смене описания. */
    isActive: insertBotTokenSchema.shape.isActive.removeDefault(),
  })
  .partial().strict();
