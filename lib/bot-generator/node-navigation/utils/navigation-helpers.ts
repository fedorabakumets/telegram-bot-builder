/**
 * @fileoverview Вспомогательные утилиты для навигации по узлам
 *
 * Содержит общие функции-хелперы для генерации кода навигации:
 * определение условия (if/elif), извлечение переменных, предупреждения.
 *
 * @module navigation-helpers
 */

import type { Node } from '@shared/schema';

/**
 * Соединение между узлами графа
 */
export interface Connection {
  /** Уникальный идентификатор соединения */
  id: string;
  /** ID исходного узла */
  source: string;
  /** ID целевого узла */
  target: string;
}

/**
 * Контекст навигации, передаваемый в функции обработки
 */
export interface NavigationContext {
  /** Отступ для условия (if/elif) */
  conditionIndent: string;
  /** Отступ для тела блока */
  bodyIndent: string;
  /** Массив всех ID узлов для валидации */
  allNodeIds: string[];
  /** Массив соединений между узлами */
  connections: Connection[];
}

/**
 * Возвращает ключевое слово условия в зависимости от индекса узла
 * @param index - Индекс узла в массиве
 * @returns 'if' для первого узла, 'elif' для остальных
 *
 * @example
 * getNodeCondition(0) // 'if'
 * getNodeCondition(1) // 'elif'
 */
export function getNodeCondition(index: number): string {
  return index === 0 ? 'if' : 'elif';
}

/**
 * Извлекает имя переменной для сохранения ввода из узла
 * @param targetNode - Узел с настройками ввода
 * @returns Имя переменной или значение по умолчанию
 *
 * @example
 * extractInputVariable({ data: { inputVariable: 'user_name' } }) // 'user_name'
 * extractInputVariable({ data: {} }) // 'response_node123'
 */
export function extractInputVariable(targetNode: Node): string {
  return targetNode.data?.inputVariable || `response_${targetNode.id}`;
}

/**
 * Извлекает ID целевого узла для перехода после ввода
 * @param targetNode - Узел с настройками ввода
 * @returns ID целевого узла или null
 *
 * @example
 * extractInputTarget({ data: { inputTargetNodeId: 'next_node' } }) // 'next_node'
 * extractInputTarget({ data: {} }) // null
 */
export function extractInputTarget(targetNode: Node): string | null {
  return targetNode.data?.inputTargetNodeId || null;
}

/**
 * Генерирует код предупреждения об отсутствии узлов для навигации
 * @param bodyIndent - Отступ для тела блока
 * @returns Строка с Python-кодом предупреждения
 *
 * @example
 * generateNoNodesWarning('    ') // '    logging.warning("Нет доступных узлов...")'
 */
export function generateNoNodesWarning(bodyIndent: string): string {
  let code = '';
  code += `${bodyIndent}# No nodes available for navigation\n`;
  code += `${bodyIndent}logging.warning(f"Нет доступных узлов для навигации")\n`;
  return code;
}
