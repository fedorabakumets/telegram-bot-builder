/**
 * @fileoverview Параметры для шаблона userbot_message
 * @module templates/userbot-message/userbot-message.params
 */

/** Параметры для генерации обработчика userbot-сообщения */
export interface UserbotMessageTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Текст сообщения */
  messageText?: string;
  /** Режим форматирования: 'html', 'markdown', 'none' */
  formatMode?: 'html' | 'markdown' | 'none';
  /** Отключить превью ссылок */
  disableLinkPreview?: boolean;
  /** Entity получателя (@username, ID, {переменная}) — основной (обратная совместимость) */
  userbotEntity?: string;
  /** Список получателей (если несколько) */
  userbotRecipients?: string[];
  /** Прикреплённые медиафайлы (пути /uploads/ или URL) */
  attachedMedia?: string[];
  /** Имя переменной для сохранения ID отправленного сообщения */
  saveMessageIdTo?: string;
  /** ID узла для автоперехода */
  autoTransitionTo?: string;
  /** ID проекта (для get_content) */
  projectId?: number | null;
}
