/**
 * @fileoverview Рендерер шаблона create-forum-topic — создание топика в форуме Telegram.
 * @module templates/create-forum-topic/create-forum-topic.renderer
 */

import type { Node } from '@shared/schema';
import type { CreateForumTopicTemplateParams, ForumChatIdSource } from './create-forum-topic.params';
import { createForumTopicParamsSchema, forumChatIdSourceSchema } from './create-forum-topic.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Проверяет корректность источника ID форум-группы.
 * @param value - проверяемое значение
 * @returns true, если значение является допустимым ForumChatIdSource
 */
function isForumChatIdSource(value: unknown): value is ForumChatIdSource {
  return forumChatIdSourceSchema.safeParse(value).success;
}

/**
 * Преобразует узел графа в параметры шаблона create_forum_topic.
 * @param node - узел графа бота
 * @returns параметры шаблона
 */
export function nodeToCreateForumTopicParams(node: Node): CreateForumTopicTemplateParams {
  const data = node.data as any;

  return {
    nodeId: node.id,
    safeName: node.id.replace(/[^a-zA-Z0-9_]/g, '_'),
    forumChatIdSource: isForumChatIdSource(data?.forumChatIdSource) ? data.forumChatIdSource : 'manual',
    forumChatId: typeof data?.forumChatId === 'string' ? data.forumChatId : '',
    forumChatVariableName: typeof data?.forumChatVariableName === 'string' ? data.forumChatVariableName : '',
    topicName: typeof data?.topicName === 'string' ? data.topicName : '',
    topicIconColor: typeof data?.topicIconColor === 'string' ? data.topicIconColor : '7322096',
    saveThreadIdTo: typeof data?.saveThreadIdTo === 'string' ? data.saveThreadIdTo : '',
    skipIfExists: data?.skipIfExists === true,
  };
}

/**
 * Генерирует Python-код из параметров шаблона create_forum_topic.
 * @param params - параметры шаблона
 * @returns сгенерированный Python-код
 */
export function generateCreateForumTopic(params: CreateForumTopicTemplateParams): string {
  const validated = createForumTopicParamsSchema.parse(params);
  return renderPartialTemplate('create-forum-topic/create-forum-topic.py.jinja2', validated);
}

/**
 * Генерирует Python-код из узла графа.
 * @param node - узел графа бота
 * @returns сгенерированный Python-код
 */
export function generateCreateForumTopicFromNode(node: Node): string {
  return generateCreateForumTopic(nodeToCreateForumTopicParams(node));
}
