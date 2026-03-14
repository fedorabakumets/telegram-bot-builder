/**
 * @fileoverview Завершение генерации Python скрипта
 * 
 * Модуль добавляет финальные компоненты к сгенерированному коду:
 * - Обработчики множественного выбора
 * - Точку входа main()
 * 
 * @module generate-complete-bot-script
 */

import type { BotNode } from './bot-generator/types';

/**
 * Опции для завершения генерации скрипта
 *
 * @example
 * const options: CompleteBotScriptOptions = {
 *   multiSelectNodes: [...],
 *   allNodeIds: ['start_1']
 * };
 */
export interface CompleteBotScriptOptions {
  /** Узлы с множественным выбором */
  multiSelectNodes: BotNode[];
  /** Все ID узлов */
  allNodeIds: string[];
  /** Все узлы бота */
  nodes: BotNode[];
  /** Генерация логики callback */
  generateMultiSelectCallbackLogic: (
    nodes: BotNode[],
    allNodeIds: string[]
  ) => string;
  /** Генерация обработчика завершения */
  generateMultiSelectDoneHandler: (
    nodes: BotNode[],
    multiSelectNodes: BotNode[],
    allNodeIds: string[]
  ) => string;
  /** Генерация обработчика ответов */
  generateMultiSelectReplyHandler: (
    nodes: BotNode[],
    allNodeIds: string[]
  ) => string;
}

/**
 * Завершает генерацию Python-кода, добавляя обработчики и точку входа
 * 
 * @param code - Текущий сгенерированный код
 * @param options - Опции завершения
 * @returns Полный Python код с точкой входа
 * 
 * @example
 * const finalCode = generateCompleteBotScriptFromNodeGraphWithDependencies(code, {
 *   multiSelectNodes: [...],
 *   allNodeIds: ['start_1'],
 *   nodes: [...],
 *   generateMultiSelectCallbackLogic: (...),
 *   generateMultiSelectDoneHandler: (...),
 *   generateMultiSelectReplyHandler: (...)
 * });
 */
export function generateCompleteBotScriptFromNodeGraphWithDependencies(
  code: string,
  options: CompleteBotScriptOptions
): string {
  const {
    multiSelectNodes,
    allNodeIds,
    nodes,
    generateMultiSelectCallbackLogic,
    generateMultiSelectDoneHandler,
    generateMultiSelectReplyHandler
  } = options;

  if (multiSelectNodes && multiSelectNodes.length > 0) {
    code += '        return\n';
    code += '    \n';

    code += generateMultiSelectCallbackLogic(multiSelectNodes, allNodeIds);
    code += generateMultiSelectDoneHandler(nodes, multiSelectNodes, allNodeIds);
    code += generateMultiSelectReplyHandler(nodes, allNodeIds);
  }

  code += '\n# Точка входа для запуска бота\n';
  code += 'if __name__ == "__main__":\n';
  code += '    asyncio.run(main())\n';

  return code;
}
