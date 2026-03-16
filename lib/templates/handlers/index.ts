/**
 * @fileoverview Экспорт модуля обработчиков (handlers)
 * @module templates/handlers/index
 *
 * Этот модуль экспортирует все шаблоны для генерации обработчиков событий:
 * - multi-select-callback: Обработчик callback для кнопок с галочками
 * - multi-select-done: Обработчик кнопки "Готово" для multi-select
 * - multi-select-reply: Обработчик reply кнопок для multi-select
 * - button-response: Обработчик кнопочных ответов при сборе ввода
 * - reply-button-handlers: Обработчики reply кнопок
 * - multi-select-button-handler: Обработчик кнопок multi-select с сохранением
 * - command-callback-handler: Обработчик командных callback кнопок
 * - reply-hide-after-click: Обработка флага hideAfterClick для reply кнопок
 * - multi-select-transition: Логика переходов после multi-select
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

// ============================================================================
// Reply Button Handlers
// ============================================================================

export type { ReplyButtonHandlersTemplateParams } from './reply-button-handlers/reply-button-handlers.params';
export type { ReplyButtonHandlersParams } from './reply-button-handlers/reply-button-handlers.schema';
export { replyButtonHandlersParamsSchema } from './reply-button-handlers/reply-button-handlers.schema';
export { generateReplyButtonHandlers } from './reply-button-handlers/reply-button-handlers.renderer';
export * from './reply-button-handlers/reply-button-handlers.fixture';

// ============================================================================
// Multi-Select Button Handler
// ============================================================================

export type { MultiSelectButtonHandlerTemplateParams } from './multi-select-button-handler/multi-select-button-handler.params';
export type { MultiSelectButtonHandlerParams } from './multi-select-button-handler/multi-select-button-handler.schema';
export { multiSelectButtonHandlerParamsSchema } from './multi-select-button-handler/multi-select-button-handler.schema';
export { generateMultiSelectButtonHandler } from './multi-select-button-handler/multi-select-button-handler.renderer';
export * from './multi-select-button-handler/multi-select-button-handler.fixture';

// ============================================================================
// Command Callback Handler
// ============================================================================

export type { CommandCallbackHandlerTemplateParams } from './command-callback-handler/command-callback-handler.params';
export type { CommandCallbackHandlerParams } from './command-callback-handler/command-callback-handler.schema';
export { commandCallbackHandlerParamsSchema } from './command-callback-handler/command-callback-handler.schema';
export { generateCommandCallbackHandler } from './command-callback-handler/command-callback-handler.renderer';
export * from './command-callback-handler/command-callback-handler.fixture';

// ============================================================================
// Reply Hide After Click
// ============================================================================

export type { ReplyHideAfterClickTemplateParams } from './reply-hide-after-click/reply-hide-after-click.params';
export type { ReplyHideAfterClickParams } from './reply-hide-after-click/reply-hide-after-click.schema';
export { replyHideAfterClickParamsSchema } from './reply-hide-after-click/reply-hide-after-click.schema';
export { generateReplyHideAfterClick } from './reply-hide-after-click/reply-hide-after-click.renderer';
export * from './reply-hide-after-click/reply-hide-after-click.fixture';

// ============================================================================
// Multi-Select Transition
// ============================================================================

export type { MultiSelectTransitionTemplateParams } from './multi-select-transition/multi-select-transition.params';
export type { MultiSelectTransitionParams } from './multi-select-transition/multi-select-transition.schema';
export { multiSelectTransitionParamsSchema } from './multi-select-transition/multi-select-transition.schema';
export { generateMultiSelectTransition } from './multi-select-transition/multi-select-transition.renderer';
export * from './multi-select-transition/multi-select-transition.fixture';
