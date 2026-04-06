/**
 * @fileoverview Экспорт модуля обработчиков узла получения токена управляемого бота
 * @module templates/get-managed-bot-token/index
 */

export type { GetManagedBotTokenEntry, GetManagedBotTokenTemplateParams } from './get-managed-bot-token.params';
export type { GetManagedBotTokenParams } from './get-managed-bot-token.schema';
export { getManagedBotTokenParamsSchema } from './get-managed-bot-token.schema';
export {
  collectGetManagedBotTokenEntries,
  generateGetManagedBotToken,
  generateGetManagedBotTokenHandlers,
} from './get-managed-bot-token.renderer';
export * from './get-managed-bot-token.fixture';
