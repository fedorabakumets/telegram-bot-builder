/**
 * @fileoverview Параметры для шаблона userbot_click_button
 * @module templates/userbot-click-button/userbot-click-button.params
 */

/** Параметры для генерации обработчика нажатия кнопки через юзербот */
export interface UserbotClickButtonTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Entity чата с кнопками (@username, ID, {переменная}) */
  userbotEntity?: string;
  /** ID сообщения с кнопками ({переменная} или число) */
  messageId?: string;
  /** Источник сообщения: 'manual' — конкретный ID, 'last' — последнее в чате */
  messageIdSource?: 'manual' | 'last';
  /** Способ поиска кнопки: 'text', 'data', 'index' */
  clickMode?: 'text' | 'data' | 'index';
  /** Значение для поиска (текст кнопки / callback_data / "row,col") */
  clickValue?: string;
  /** Переменная для сохранения alert */
  saveAlertTo?: string;
  /** Переменная для сохранения текста обновлённого сообщения */
  saveResultTo?: string;
  /** Переменная для сохранения кнопок (JSON) */
  saveButtonsTo?: string;
  /** Переменная для сохранения флага наличия медиа */
  saveHasMediaTo?: string;
  /** Переменная для сохранения медиа-объекта */
  saveMediaTo?: string;
  /** Стратегия ожидания ответа: 'edit' — ждать редактирование, 'new_message' — ждать новое сообщение */
  responseStrategy?: 'edit' | 'new_message';
  /** ID узла для автоперехода */
  autoTransitionTo?: string;
  /** ID проекта (для get_content) */
  projectId?: number | null;
}
