/**
 * @fileoverview Утилита очистки «висячих» ссылок на узлы, оказавшиеся вне группы.
 * При групповом перемещении узлов между листами связи, пересекающие границу
 * группы, должны обрываться. Эта утилита удаляет ссылки на узлы, чьи id
 * отсутствуют в наборе допустимых (оставшихся на том же листе) идентификаторов.
 * @module client/utils/sheets/clear-external-references
 */

/**
 * Простые строковые поля-ссылки на узел (одна ссылка = одно поле).
 * Совпадают со списком в updateNodeReferencesInData, плюс sourceMessageNodeId.
 */
const SIMPLE_REF_FIELDS = [
  'inputTargetNodeId',
  'targetNodeId',
  'next_node_id',
  'nextNodeId',
  'autoNavigateTarget',
  'fallbackTarget',
  'autoTransitionTo',
  'sourceNodeId',
  'keyboardNodeId',
  'sourceMessageNodeId'
];

/**
 * Очищает поле .target у элементов массива, если цель не входит в validIds.
 *
 * @param arr - Массив элементов с возможным полем target
 * @param validIds - Набор допустимых идентификаторов узлов
 * @returns Новый массив с обнулёнными «висячими» target
 */
function clearTargetsInArray(arr: any[], validIds: Set<string>): any[] {
  return arr.map((item: any) => {
    if (item && item.target && !validIds.has(item.target)) {
      return { ...item, target: undefined };
    }
    return item;
  });
}

/**
 * Возвращает глубокую копию data, в которой все ссылки на узлы вне validIds
 * очищены. Логика очистки повторяет сброс полей при удалении одиночной связи:
 * сброс autoTransitionTo также выключает enableAutoTransition, а сброс
 * sourceMessageNodeId возвращает forward_message к текущему сообщению.
 *
 * @param data - Объект данных узла
 * @param validIds - Набор допустимых идентификаторов целей
 * @returns Новый объект данных с очищенными внешними ссылками
 */
export function clearExternalNodeReferences(data: any, validIds: Set<string>): any {
  if (!data) return data;

  const result = JSON.parse(JSON.stringify(data)); // Глубокая копия

  // Простые строковые ссылки: удаляем поле, если цель вне группы
  for (const field of SIMPLE_REF_FIELDS) {
    if (result?.[field] && !validIds.has(result[field])) {
      delete result[field];
      // Сброс сопутствующих флагов автоперехода
      if (field === 'autoTransitionTo') {
        result.enableAutoTransition = false;
      }
      // Сброс источника пересылаемого сообщения forward_message
      if (field === 'sourceMessageNodeId') {
        result.sourceMessageIdSource = 'current_message';
        delete result.sourceMessageId;
        delete result.sourceMessageVariableName;
      }
    }
  }

  // Кнопки
  if (Array.isArray(result?.buttons)) {
    result.buttons = clearTargetsInArray(result.buttons, validIds);
  }

  // Условные сообщения (и вложенные кнопки)
  if (Array.isArray(result?.conditionalMessages)) {
    result.conditionalMessages = result.conditionalMessages.map((condition: any) => {
      const updated = { ...condition };
      if (updated.target && !validIds.has(updated.target)) {
        updated.target = undefined;
      }
      if (Array.isArray(updated.buttons)) {
        updated.buttons = clearTargetsInArray(updated.buttons, validIds);
      }
      return updated;
    });
  }

  // Команды
  if (Array.isArray(result?.commands)) {
    result.commands = clearTargetsInArray(result.commands, validIds);
  }

  // Опции
  if (Array.isArray(result?.options)) {
    result.options = clearTargetsInArray(result.options, validIds);
  }

  // inputConfig.next_node_id
  if (result?.inputConfig?.next_node_id && !validIds.has(result.inputConfig.next_node_id)) {
    result.inputConfig.next_node_id = undefined;
  }

  // Ветки condition-узла
  if (Array.isArray(result?.branches)) {
    result.branches = clearTargetsInArray(result.branches, validIds);
  }

  // Ветки параллельного запуска parallel_split
  if (Array.isArray(result?.parallelBranches)) {
    result.parallelBranches = clearTargetsInArray(result.parallelBranches, validIds);
  }

  return result;
}
