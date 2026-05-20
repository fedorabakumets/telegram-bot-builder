/**
 * @fileoverview Параметры для шаблона userbot_edit_trigger
 * @module templates/userbot-edit-trigger/userbot-edit-trigger.params
 */

/** Параметры триггера редактирования сообщения через юзербот */
export interface UserbotEditTriggerTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Entity чата для фильтрации (@username, ID, {переменная}). Пусто = любой чат */
  userbotEntity?: string;
  /** Тип фильтра текста: 'any' | 'contains' | 'regex' */
  filterType?: 'any' | 'contains' | 'regex';
  /** Значение фильтра (текст или regex паттерн) */
  filterValue?: string;
  /** Переменная для сохранения текста отредактированного сообщения */
  saveTextTo?: string;
  /** Переменная для сохранения ID сообщения */
  saveMessageIdTo?: string;
  /** Переменная для сохранения ID чата */
  saveChatIdTo?: string;
  /** Переменная для сохранения ID отправителя */
  saveSenderIdTo?: string;
  /** ID узла для автоперехода */
  autoTransitionTo?: string;
  /** ID проекта */
  projectId?: number | null;
}
