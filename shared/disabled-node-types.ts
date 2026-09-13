/**
 * @fileoverview Политика выключения типов блоков администратором
 * @module shared/disabled-node-types
 */

/** Типы, которые нельзя выключить (ядро конструктора) */
export const CORE_NODE_TYPES = [
  'message',
  'command_trigger',
  'condition',
  'input',
] as const;

/** Тип из ядра конструктора */
export type CoreNodeType = (typeof CORE_NODE_TYPES)[number];

/**
 * Проверяет, относится ли тип к ядру конструктора
 * @param type - Внутреннее имя типа блока
 * @returns true, если тип нельзя выключить
 */
export function isCoreNodeType(type: string): type is CoreNodeType {
  return (CORE_NODE_TYPES as readonly string[]).includes(type);
}

/**
 * Текст отказа при создании или запуске с выключенным типом
 * @param type - Внутреннее имя типа
 * @param nodeIds - Идентификаторы блоков в проекте (для запуска)
 * @returns Сообщение на русском
 */
export function formatDisabledNodeTypeMessage(
  type: string,
  nodeIds?: string[],
): string {
  if (nodeIds && nodeIds.length > 0) {
    return (
      `Тип «${type}» отключён администратором ` +
      `(блоки: ${nodeIds.join(', ')})`
    );
  }
  return `Тип «${type}» отключён администратором`;
}
