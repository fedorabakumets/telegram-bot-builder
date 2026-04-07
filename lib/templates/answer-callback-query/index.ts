/**
 * @fileoverview Экспорт модуля обработчиков узла answer_callback_query
 * @module templates/answer-callback-query/index
 */

export type { AnswerCallbackQueryEntry, AnswerCallbackQueryTemplateParams } from './answer-callback-query.params';
export type { AnswerCallbackQueryParams } from './answer-callback-query.schema';
export { answerCallbackQueryParamsSchema } from './answer-callback-query.schema';
export {
  collectAnswerCallbackQueryEntries,
  generateAnswerCallbackQuery,
  generateAnswerCallbackQueryHandlers,
} from './answer-callback-query.renderer';
export * from './answer-callback-query.fixture';
