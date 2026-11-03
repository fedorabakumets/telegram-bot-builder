/**
 * @fileoverview Разрешённые поля обычного редактирования токена без переноса владельца или проекта.
 */
import { insertBotTokenSchema } from './tables/bot-tokens';
/** Профиль, служебные поля, доступ и настройки userbot меняются отдельными маршрутами. */
export const updateBotTokenSchema = insertBotTokenSchema.pick({ token: true, name: true, description: true, isDefault: true, isActive: true }).partial().strict();
