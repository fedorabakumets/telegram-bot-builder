/**
 * @fileoverview Параметры для шаблона userbot_inline_query
 * @module templates/userbot-inline-query/userbot-inline-query.params
 */

/** Параметры для генерации обработчика inline-запроса через юзербот */
export interface UserbotInlineQueryTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Username бота для inline-запроса */
  botUsername?: string;
  /** Текст запроса */
  query?: string;
  /** Целевой чат для отправки результата */
  targetChat?: string;
  /** Отправить в тот же чат (botUsername) */
  sendToSameChat?: boolean;
  /** Индекс результата (0 = первый) */
  resultIndex?: string;
  /** Переменная для title результата */
  saveResultTitleTo?: string;
  /** Переменная для description результата */
  saveResultDescTo?: string;
  /** Переменная для ID отправленного сообщения */
  saveResponseIdTo?: string;
  /** ID узла для автоперехода */
  autoTransitionTo?: string;
  /** ID проекта (для get_content) */
  projectId?: number | null;
}
