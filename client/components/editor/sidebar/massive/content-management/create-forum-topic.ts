/**
 * @fileoverview Определение компонента создания топика в форум-группе Telegram
 * @module components/editor/sidebar/massive/content-management/create-forum-topic
 */

import { ComponentDefinition } from '@shared/schema';

/** Создание топика в форум-группе Telegram */
export const createForumTopicNode: ComponentDefinition = {
  id: 'create-forum-topic',
  name: 'Создать топик',
  description: 'Создаёт топик в Telegram супергруппе с включёнными форумами',
  icon: 'fas fa-layer-group',
  color: 'bg-teal-100 text-teal-600',
  type: 'create_forum_topic',
  defaultData: {
    forumChatId: '',
    forumChatIdSource: 'manual',
    forumChatVariableName: '',
    topicName: '',
    topicIconColor: '7322096',
    saveThreadIdTo: '',
    skipIfExists: false,
  },
};
