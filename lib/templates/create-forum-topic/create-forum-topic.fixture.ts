/**
 * @fileoverview Тестовые данные для шаблона create-forum-topic.
 * @module templates/create-forum-topic/create-forum-topic.fixture
 */

import type { Node } from '@shared/schema';
import type { CreateForumTopicTemplateParams } from './create-forum-topic.params';

/** Базовые параметры: ручной ID группы, сохранение thread_id */
export const validParamsBasic: CreateForumTopicTemplateParams = {
  nodeId: 'create_forum_topic_1',
  safeName: 'create_forum_topic_1',
  forumChatIdSource: 'manual',
  forumChatId: '-1002300967595',
  topicName: 'Новый топик',
  topicIconColor: '7322096',
  saveThreadIdTo: 'forum_thread_id',
  skipIfExists: false,
};

/** Параметры: ID группы из переменной, название с подстановкой переменной */
export const validParamsVariable: CreateForumTopicTemplateParams = {
  nodeId: 'create_forum_topic_2',
  safeName: 'create_forum_topic_2',
  forumChatIdSource: 'variable',
  forumChatVariableName: 'forum_chat_id',
  topicName: 'Топик {user_name}',
  topicIconColor: '16766590',
  saveThreadIdTo: 'thread_id',
  skipIfExists: false,
};

/** Параметры: флаг skipIfExists включён */
export const validParamsSkipIfExists: CreateForumTopicTemplateParams = {
  nodeId: 'create_forum_topic_3',
  safeName: 'create_forum_topic_3',
  forumChatIdSource: 'manual',
  forumChatId: '-1001234567890',
  topicName: 'Поддержка',
  topicIconColor: '9367192',
  saveThreadIdTo: 'support_thread_id',
  skipIfExists: true,
};

/** Параметры: без сохранения thread_id */
export const validParamsNoSave: CreateForumTopicTemplateParams = {
  nodeId: 'create_forum_topic_4',
  safeName: 'create_forum_topic_4',
  forumChatIdSource: 'manual',
  forumChatId: '-1009999999999',
  topicName: 'Временный топик',
  topicIconColor: '16478047',
  saveThreadIdTo: '',
  skipIfExists: false,
};

/** Узел графа: базовое создание топика */
export const createForumTopicNodeBasic: Node = {
  id: 'create_forum_topic_1',
  type: 'create_forum_topic',
  position: { x: 0, y: 0 },
  data: {
    forumChatIdSource: 'manual',
    forumChatId: '-1002300967595',
    forumChatVariableName: '',
    topicName: 'Новый топик',
    topicIconColor: '7322096',
    saveThreadIdTo: 'forum_thread_id',
    skipIfExists: false,
  } as any,
};

/** Узел графа: ID группы из переменной */
export const createForumTopicNodeVariable: Node = {
  id: 'create_forum_topic_var',
  type: 'create_forum_topic',
  position: { x: 0, y: 0 },
  data: {
    forumChatIdSource: 'variable',
    forumChatId: '',
    forumChatVariableName: 'forum_chat_id',
    topicName: 'Топик {user_name}',
    topicIconColor: '16766590',
    saveThreadIdTo: 'thread_id',
    skipIfExists: false,
  } as any,
};

/** Узел графа: skipIfExists включён */
export const createForumTopicNodeSkip: Node = {
  id: 'create_forum_topic_skip',
  type: 'create_forum_topic',
  position: { x: 0, y: 0 },
  data: {
    forumChatIdSource: 'manual',
    forumChatId: '-1001234567890',
    forumChatVariableName: '',
    topicName: 'Поддержка',
    topicIconColor: '9367192',
    saveThreadIdTo: 'support_thread_id',
    skipIfExists: true,
  } as any,
};
