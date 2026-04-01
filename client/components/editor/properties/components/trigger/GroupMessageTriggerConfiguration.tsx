/**
 * @fileoverview Панель свойств узла триггера сообщения в группе/топике Telegram
 * @module properties/components/trigger/GroupMessageTriggerConfiguration
 */

import { Node } from '@shared/schema';
import { GroupMessageTriggerConfiguration as Config } from '../configuration/group-message-trigger-configuration';

/** Пропсы компонента GroupMessageTriggerConfiguration */
interface GroupMessageTriggerConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Все узлы из всех листов */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
}

/** Обёртка конфигурации триггера сообщения в группе */
export function GroupMessageTriggerConfiguration(props: GroupMessageTriggerConfigurationProps) {
  return <Config {...props} />;
}
