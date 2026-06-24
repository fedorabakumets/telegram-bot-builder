/**
 * @fileoverview Чистый ремап ссылок на ноды внутри data при дублировании листа
 * @description Портирован из client/utils/sheets/sheet-node-references.ts для
 * использования в lib (live-редактирование через БД). Принимает объект data ноды
 * и карту соответствия старых id нод новым, возвращает НОВЫЙ объект data (deep copy)
 * со всеми перенаправленными ссылками. Покрывает простые поля-ссылки, массивы с
 * полем target (buttons, conditionalMessages с вложенными buttons, commands,
 * options, branches, parallelBranches) и вложенный inputConfig.next_node_id.
 * @module lib/bot-tools/sheet-node-references
 */

/** Простые поля data, значение которых — id ноды (подлежат ремапу) */
const NODE_REF_FIELDS = [
  'inputTargetNodeId',
  'targetNodeId',
  'next_node_id',
  'nextNodeId',
  'autoNavigateTarget',
  'fallbackTarget',
  'autoTransitionTo',
  'sourceNodeId',
  'keyboardNodeId',
  'sourceMessageNodeId',
] as const;

/**
 * Ремаппит значение target элемента массива по карте id нод (иммутабельно).
 * @param item - Элемент массива (кнопка/ветка/команда/опция)
 * @param nodeIdMap - Карта старый id ноды → новый id
 * @returns Новый элемент с обновлённым target (если был в карте)
 */
function remapTarget(item: any, nodeIdMap: Map<string, string>): any {
  const updated = { ...item };
  if (updated.target && nodeIdMap.has(updated.target)) {
    updated.target = nodeIdMap.get(updated.target);
  }
  return updated;
}

/**
 * Обновляет все ссылки на ноды внутри объекта data, используя карту соответствия
 * старых id нод новым. Функция чистая: делает глубокую копию data и не мутирует вход.
 * @param data - Объект data ноды, в котором нужно перенаправить ссылки
 * @param nodeIdMap - Карта соответствия старых id нод новым id
 * @returns Новый объект data с обновлёнными ссылками на ноды
 */
export function updateNodeReferencesInData(data: any, nodeIdMap: Map<string, string>): any {
  if (!data) return data;

  // Глубокая копия — гарантирует чистоту функции и сериализуемость результата
  const updatedData = JSON.parse(JSON.stringify(data));

  // Простые ссылки на ноды
  for (const field of NODE_REF_FIELDS) {
    if (updatedData?.[field] && nodeIdMap.has(updatedData[field])) {
      updatedData[field] = nodeIdMap.get(updatedData[field]);
    }
  }

  // Кнопки
  if (Array.isArray(updatedData?.buttons)) {
    updatedData.buttons = updatedData.buttons.map((button: any) => remapTarget(button, nodeIdMap));
  }

  // Условные сообщения (+ вложенные кнопки)
  if (Array.isArray(updatedData?.conditionalMessages)) {
    updatedData.conditionalMessages = updatedData.conditionalMessages.map((condition: any) => {
      const updatedCondition = remapTarget(condition, nodeIdMap);
      if (Array.isArray(updatedCondition.buttons)) {
        updatedCondition.buttons = updatedCondition.buttons.map((button: any) =>
          remapTarget(button, nodeIdMap),
        );
      }
      return updatedCondition;
    });
  }

  // Команды
  if (Array.isArray(updatedData?.commands)) {
    updatedData.commands = updatedData.commands.map((command: any) => remapTarget(command, nodeIdMap));
  }

  // Опции
  if (Array.isArray(updatedData?.options)) {
    updatedData.options = updatedData.options.map((option: any) => remapTarget(option, nodeIdMap));
  }

  // Ветки condition-узла
  if (Array.isArray(updatedData?.branches)) {
    updatedData.branches = updatedData.branches.map((branch: any) => remapTarget(branch, nodeIdMap));
  }

  // Параллельные ветки (parallel-узел)
  if (Array.isArray(updatedData?.parallelBranches)) {
    updatedData.parallelBranches = updatedData.parallelBranches.map((branch: any) =>
      remapTarget(branch, nodeIdMap),
    );
  }

  // Вложенный inputConfig.next_node_id
  if (updatedData?.inputConfig?.next_node_id && nodeIdMap.has(updatedData.inputConfig.next_node_id)) {
    updatedData.inputConfig.next_node_id = nodeIdMap.get(updatedData.inputConfig.next_node_id);
  }

  return updatedData;
}
