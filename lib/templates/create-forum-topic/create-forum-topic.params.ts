/**
 * @fileoverview Параметры шаблона create-forum-topic — создание топика в форуме Telegram.
 * @module templates/create-forum-topic/create-forum-topic.params
 */

/** Источник ID форум-группы: "manual" — вручную, "variable" — из переменной */
export type ForumChatIdSource = 'manual' | 'variable';

/** Параметры шаблона create_forum_topic */
export interface CreateForumTopicTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Безопасное имя функции (без спецсимволов) */
  safeName: string;
  /** Источник ID форум-группы */
  forumChatIdSource?: ForumChatIdSource;
  /** ID или username форум-группы (при forumChatIdSource === 'manual') */
  forumChatId?: string;
  /** Имя переменной с ID форум-группы (при forumChatIdSource === 'variable') */
  forumChatVariableName?: string;
  /** Название создаваемого топика, поддерживает {переменные} */
  topicName?: string;
  /** Цвет иконки топика (числовое значение цвета Telegram) */
  topicIconColor?: string;
  /** Имя переменной для сохранения thread_id созданного топика */
  saveThreadIdTo?: string;
  /** Не создавать топик повторно, если переменная saveThreadIdTo уже заполнена */
  skipIfExists?: boolean;
}
