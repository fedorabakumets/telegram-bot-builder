/**
 * @fileoverview Экспорт модуля обработчиков (handlers)
 * @module templates/handlers/index
 *
 * Этот модуль экспортирует все шаблоны для генерации обработчиков событий:
 * - multi-select-callback: Обработчик callback для кнопок с галочками
 * - multi-select-done: Обработчик кнопки "Готово" для multi-select
 * - multi-select-reply: Обработчик reply кнопок для multi-select
 * - button-response: Обработчик кнопочных ответов при сборе ввода
 */

// ============================================================================
// Multi-Select Callback Handler
// ============================================================================

export type { MultiSelectCallbackTemplateParams } from './multi-select-callback/multi-select-callback.params';
export type { MultiSelectCallbackParams } from './multi-select-callback/multi-select-callback.schema';
export { multiSelectCallbackParamsSchema } from './multi-select-callback/multi-select-callback.schema';
export { generateMultiSelectCallback } from './multi-select-callback/multi-select-callback.renderer';
export * from './multi-select-callback/multi-select-callback.fixture';

// ============================================================================
// Multi-Select Done Handler
// ============================================================================

export type { MultiSelectDoneTemplateParams } from './multi-select-done/multi-select-done.params';
export type { MultiSelectDoneParams } from './multi-select-done/multi-select-done.schema';
export { multiSelectDoneParamsSchema } from './multi-select-done/multi-select-done.schema';
export { generateMultiSelectDone } from './multi-select-done/multi-select-done.renderer';
export * from './multi-select-done/multi-select-done.fixture';

// ============================================================================
// Multi-Select Reply Handler
// ============================================================================

export type { MultiSelectReplyTemplateParams } from './multi-select-reply/multi-select-reply.params';
export type { MultiSelectReplyParams } from './multi-select-reply/multi-select-reply.schema';
export { multiSelectReplyParamsSchema } from './multi-select-reply/multi-select-reply.schema';
export { generateMultiSelectReply } from './multi-select-reply/multi-select-reply.renderer';
export * from './multi-select-reply/multi-select-reply.fixture';

// ============================================================================
// Button Response Handler
// ============================================================================

export type { ButtonResponseTemplateParams } from './button-response/button-response.params';
export type { ButtonResponseParams } from './button-response/button-response.schema';
export { buttonResponseParamsSchema } from './button-response/button-response.schema';
export { generateButtonResponse } from './button-response/button-response.renderer';
export * from './button-response/button-response.fixture';
