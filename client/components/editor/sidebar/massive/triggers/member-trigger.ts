/**
 * @fileoverview Определение триггера входа/выхода участника группы
 * @module components/editor/sidebar/massive/triggers/member-trigger
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Триггер участника — срабатывает когда пользователь вошёл или вышел из группы
 */
export const memberTrigger: ComponentDefinition = {
  id: 'member-trigger',
  name: 'Участник вошёл или вышел',
  description: 'Срабатывает когда участник вошёл или вышел из группы',
  icon: 'fas fa-user-plus',
  color: 'bg-emerald-100 text-emerald-600',
  type: 'member_trigger' as any,
  defaultData: {
    /** Тип события: join, leave или both */
    memberEventType: 'join',
    /** ID группы для фильтрации */
    groupChatId: '',
    /** Источник ID группы */
    groupChatIdSource: 'manual',
    /** Имя переменной с ID группы */
    groupChatVariableName: '',
    /** Переменная для user.id вошедшего участника */
    saveJoinedUserIdTo: 'joined_user_id',
    /** Переменная для username вошедшего участника */
    saveJoinedUsernameTo: 'joined_username',
    /** Переменная для user.id вышедшего участника */
    saveLeftUserIdTo: 'left_user_id',
    /** Переменная для username вышедшего участника */
    saveLeftUsernameTo: 'left_username',
    /** ID следующего узла для автоперехода */
    autoTransitionTo: '',
  },
};
