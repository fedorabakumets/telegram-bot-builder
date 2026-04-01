/**
 * @fileoverview TypeScript типы для конфигурации узла group_message_trigger
 * @module components/editor/properties/components/configuration/group-message-trigger-types
 */

import { Node } from '@shared/schema';

/** Источник ID группы: "manual" — вручную, "variable" — из переменной */
export type GroupChatIdSource = 'manual' | 'variable';

/** Пропсы компонента конфигурации узла group_message_trigger */
export interface GroupMessageTriggerConfigProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Все узлы из всех листов для извлечения доступных переменных */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
}
