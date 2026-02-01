// Вспомогательные функции, которые используются в generateCompleteBotScriptFromNodeGraph
import { generateMultiSelectCallbackLogic } from './generateMultiSelectCallbackLogic';
import { generateMultiSelectDoneHandler } from './generateMultiSelectDoneHandler';
import { generateMultiSelectReplyHandler } from './generateMultiSelectReplyHandler';

/**
 * Генерирует завершающую часть скрипта бота из графа узлов
 * @returns {string} Сгенерированный код завершающей части бота
 */
export function generateCompleteBotScriptFromNodeGraph(
  code: string,
  multiSelectNodes: any[],
  allNodeIds: string[],
  isLoggingEnabled: () => boolean,
  nodes?: any[]
): string {
  code += '        return\n';
  code += '    \n';

  // Добавляем логику обработки мультиселекта
  code += generateMultiSelectCallbackLogic(multiSelectNodes, allNodeIds, isLoggingEnabled);

  // Добавляем обработчик завершения мультиселекта
  code += generateMultiSelectDoneHandler(nodes || [], multiSelectNodes, allNodeIds, isLoggingEnabled);

  // Закрываем if (multiSelectNodes.length > 0)
  // Добавляем обработчик ответов на мультиселект
  code += generateMultiSelectReplyHandler(nodes || [], allNodeIds, isLoggingEnabled);

  // Добавляем точку входа для запуска приложения
  code += 'if __name__ == "__main__":\n';
  code += '    asyncio.run(main())\n';

  return code;
}