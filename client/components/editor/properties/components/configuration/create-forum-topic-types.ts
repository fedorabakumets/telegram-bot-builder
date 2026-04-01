/**
 * @fileoverview TypeScript типы для конфигурации узла create_forum_topic
 * @module components/editor/properties/components/configuration/create-forum-topic-types
 */

import { Node } from '@shared/schema';

/** Источник ID чата: "manual" — вручную, "variable" — из переменной */
export type ForumChatIdSource = 'manual' | 'variable';

/** Допустимые значения цвета иконки топика Telegram */
export type TopicIconColor =
  | '7322096'
  | '16766590'
  | '13338331'
  | '9367192'
  | '16749490'
  | '16478047';

/** Пропсы компонента конфигурации узла create_forum_topic */
export interface CreateForumTopicConfigProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}
