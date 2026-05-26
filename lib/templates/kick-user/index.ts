/**
 * @fileoverview Экспорт модуля шаблона kick_user
 * @module templates/kick-user/index
 */

export type { KickUserEntry, KickUserTemplateParams, KickUserIdSource, KickUserChatIdSource } from './kick-user.params';
export type { KickUserParams } from './kick-user.schema';
export { kickUserParamsSchema, kickUserIdSourceSchema, kickUserChatIdSourceSchema } from './kick-user.schema';
export {
  collectKickUserEntries,
  generateKickUser,
  generateKickUserHandlers,
} from './kick-user.renderer';
export * from './kick-user.fixture';
