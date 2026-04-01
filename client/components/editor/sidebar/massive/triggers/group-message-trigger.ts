/**
 * @fileoverview Определение компонента триггера сообщения в группе/топике Telegram
 * @module components/editor/sidebar/massive/triggers/group-message-trigger
 */

import { ComponentDefinition } from '@shared/schema';

/** Триггер сообщения в группе — срабатывает когда оператор пишет в топик форум-группы */
export const groupMessageTrigger: ComponentDefinition = {
  id: 'group-message-trigger',
  name: 'Триггер входящего сообщения в теме группы',
  description: 'Срабатывает когда оператор пишет в топик форум-группы',
  icon: 'fas fa-comments',
  color: 'bg-violet-100 text-violet-600',
  type: 'group_message_trigger',
  defaultData: {
    groupChatId: '',
    groupChatIdSource: 'manual',
    groupChatVariableName: '',
    threadIdVariable: 'support_thread_id',
    resolvedUserIdVariable: 'resolved_user_id',
  },
};
