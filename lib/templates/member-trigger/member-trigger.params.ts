/**
 * @fileoverview Параметры для шаблона обработчиков триггера входа/выхода участника группы
 * @module templates/member-trigger/member-trigger.params
 */

/** Тип события участника: вход, выход или оба */
export type MemberEventType = 'join' | 'leave' | 'both';

/** Источник ID группы для фильтрации */
export type MemberGroupChatIdSource = 'manual' | 'variable';

/**
 * Один узел member_trigger
 */
export interface MemberTriggerEntry {
  /** ID узла member_trigger */
  nodeId: string;
  /** ID целевого узла */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
  /** Тип события: join, leave или both */
  memberEventType: MemberEventType;
  /** ID группы для фильтрации (без префикса -100) */
  groupChatId?: string;
  /** Источник ID группы */
  groupChatIdSource: MemberGroupChatIdSource;
  /** Имя переменной с ID группы */
  groupChatVariableName?: string;
  /** Переменная для сохранения user.id вошедшего участника */
  saveJoinedUserIdTo?: string;
  /** Переменная для сохранения username вошедшего участника */
  saveJoinedUsernameTo?: string;
  /** Переменная для сохранения user.id вышедшего участника */
  saveLeftUserIdTo?: string;
  /** Переменная для сохранения username вышедшего участника */
  saveLeftUsernameTo?: string;
  /** Нужно ли применять фильтр по ID группы */
  hasGroupChatFilter: boolean;
}

/**
 * Параметры для генерации обработчиков триггера участника
 */
export interface MemberTriggerTemplateParams {
  /** Массив триггеров входа/выхода участника */
  entries: MemberTriggerEntry[];
}
