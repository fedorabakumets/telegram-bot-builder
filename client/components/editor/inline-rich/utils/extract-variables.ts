/**
 * @fileoverview Утилита извлечения переменных из текста редактора
 * @module utils/extract-variables
 */

import type { Node } from '@shared/schema';

/**
 * Переменная с информацией об имени
 */
export interface VariableInfo {
  /** Имя переменной */
  name: string;
}

/**
 * Извлекает переменные из текста и проверяет, включена ли опция "Не перезаписывать"
 * @param text - Текст сообщения с переменными вида {name}
 * @param allNodes - Все узлы проекта для поиска источника переменной
 * @returns Массив найденных переменных с флагом appendVariable
 */
export function extractVariables(text: string, allNodes: Node[]): VariableInfo[] {
  const regex = /\{([^}|]+)(?:\|[^}]+)?\}/g;
  const matches = text.matchAll(regex);
  const variables: VariableInfo[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const name = match[1].trim();
    if (seen.has(name)) continue;
    seen.add(name);

    // Ищем узел, где создана эта переменная
    const sourceNode = allNodes.find(
      node =>
        node.data.inputVariable === name ||
        node.data.photoInputVariable === name ||
        node.data.videoInputVariable === name ||
        node.data.audioInputVariable === name ||
        node.data.documentInputVariable === name
    );

    // Если узел не найден — переменная не существует, пропускаем
    if (!sourceNode) continue;

    // Добавляем только если включено "Не перезаписывать"
    if (sourceNode.data.appendVariable) {
      variables.push({ name });
    }
  }

  return variables;
}
