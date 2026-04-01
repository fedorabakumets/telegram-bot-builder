/**
 * @fileoverview Экспорт модуля шаблона create-forum-topic — создание топика в форуме Telegram.
 * @module templates/create-forum-topic/index
 */

export type {
  CreateForumTopicTemplateParams,
  ForumChatIdSource,
} from './create-forum-topic.params';
export type { CreateForumTopicParams } from './create-forum-topic.schema';
export {
  createForumTopicParamsSchema,
  forumChatIdSourceSchema,
} from './create-forum-topic.schema';
export {
  generateCreateForumTopic,
  generateCreateForumTopicFromNode,
  nodeToCreateForumTopicParams,
} from './create-forum-topic.renderer';
export * from './create-forum-topic.fixture';
