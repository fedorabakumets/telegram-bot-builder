/**
 * @fileoverview Утилита для обновления ссылок на узлы внутри данных листа.
 * Используется при дублировании листов для корректного переназначения ID узлов.
 * @module client/utils/sheets/sheet-node-references
 */

/**
 * Обновляет все ID ссылок на узлы внутри объекта данных.
 * Проходит по всем свойствам объекта данных и обновляет ссылки на узлы,
 * используя карту соответствия старых и новых ID.
 *
 * @param data - Объект данных узла, в котором нужно обновить ссылки
 * @param nodeIdMap - Карта соответствия старых ID узлов новым ID
 * @returns Новый объект данных с обновлёнными ссылками на узлы
 */
export function updateNodeReferencesInData(data: any, nodeIdMap: Map<string, string>): any {
  if (!data) return data;

  const updatedData = JSON.parse(JSON.stringify(data)); // Deep copy

  // Простые ссылки на узлы
  const nodeRefFields = [
    'inputTargetNodeId',
    'targetNodeId',
    'next_node_id',
    'nextNodeId',
    'autoNavigateTarget',
    'fallbackTarget',
    'autoTransitionTo',
    'sourceNodeId'
  ];

  for (const field of nodeRefFields) {
    if (updatedData?.[field] && nodeIdMap.has(updatedData[field])) {
      updatedData[field] = nodeIdMap.get(updatedData[field]);
    }
  }

  // Обновляем кнопки
  if (updatedData?.buttons && Array.isArray(updatedData.buttons)) {
    updatedData.buttons = updatedData.buttons.map((button: any) => {
      const updatedButton = { ...button };
      if (updatedButton.target && nodeIdMap.has(updatedButton.target)) {
        updatedButton.target = nodeIdMap.get(updatedButton.target);
      }
      return updatedButton;
    });
  }

  // Обновляем условные сообщения
  if (updatedData?.conditionalMessages && Array.isArray(updatedData.conditionalMessages)) {
    updatedData.conditionalMessages = updatedData.conditionalMessages.map((condition: any) => {
      const updatedCondition = { ...condition };

      if (updatedCondition.target && nodeIdMap.has(updatedCondition.target)) {
        updatedCondition.target = nodeIdMap.get(updatedCondition.target);
      }

      if (updatedCondition.buttons && Array.isArray(updatedCondition.buttons)) {
        updatedCondition.buttons = updatedCondition.buttons.map((button: any) => {
          const updatedButton = { ...button };
          if (updatedButton.target && nodeIdMap.has(updatedButton.target)) {
            updatedButton.target = nodeIdMap.get(updatedButton.target);
          }
          return updatedButton;
        });
      }

      return updatedCondition;
    });
  }

  // Обновляем команды
  if (updatedData?.commands && Array.isArray(updatedData.commands)) {
    updatedData.commands = updatedData.commands.map((command: any) => {
      const updatedCommand = { ...command };
      if (updatedCommand.target && nodeIdMap.has(updatedCommand.target)) {
        updatedCommand.target = nodeIdMap.get(updatedCommand.target);
      }
      return updatedCommand;
    });
  }

  // Обновляем опции
  if (updatedData?.options && Array.isArray(updatedData.options)) {
    updatedData.options = updatedData.options.map((option: any) => {
      const updatedOption = { ...option };
      if (updatedOption.target && nodeIdMap.has(updatedOption.target)) {
        updatedOption.target = nodeIdMap.get(updatedOption.target);
      }
      return updatedOption;
    });
  }

  // Обновляем inputConfig
  if (updatedData?.inputConfig) {
    if (updatedData.inputConfig.next_node_id && nodeIdMap.has(updatedData.inputConfig.next_node_id)) {
      updatedData.inputConfig.next_node_id = nodeIdMap.get(updatedData.inputConfig.next_node_id);
    }
  }

  // Обновляем ветки condition-узла
  if (updatedData?.branches && Array.isArray(updatedData.branches)) {
    updatedData.branches = updatedData.branches.map((branch: any) => {
      const updatedBranch = { ...branch };
      if (updatedBranch.target && nodeIdMap.has(updatedBranch.target)) {
        updatedBranch.target = nodeIdMap.get(updatedBranch.target);
      }
      return updatedBranch;
    });
  }

  return updatedData;
}
