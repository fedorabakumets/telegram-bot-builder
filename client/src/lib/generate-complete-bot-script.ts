/**
 * Генерирует полный скрипт бота из графа узлов
 * @returns {string} Сгенерированный код бота
 */
export function generateCompleteBotScriptFromNodeGraph(
  code: string,
  multiSelectNodes: any[],
  allNodeIds: any[],
  isLoggingEnabled: () => boolean,
  nodes?: any[]
): string {
  code += '        return\n';
  code += '    \n';

  // Добавляем логику обработки мультиселекта
  // Предполагаем, что функции generateMultiSelectCallbackLogic и generateMultiSelectDoneHandler
  // будут импортированы или переданы как параметры
  // Здесь я буду использовать их напрямую, предполагая, что они будут импортированы
  
  // Импорты, которые нужны для работы функции
  // import { generateMultiSelectCallbackLogic } from './Keyboard/generateMultiSelectCallbackLogic';
  // import { generateMultiSelectDoneHandler } from './Keyboard/generateMultiSelectDoneHandler';
  // import { generateMultiSelectReplyHandler } from './Keyboard/generateMultiSelectReplyHandler';

  // Добавляем логику обработки мультиселекта
  // NOTE: Эти функции должны быть переданы как параметры или импортированы
  // code += generateMultiSelectCallbackLogic(multiSelectNodes, allNodeIds, isLoggingEnabled);

  // Добавляем обработчик завершения мультиселекта
  // code += generateMultiSelectDoneHandler(nodes || [], multiSelectNodes, allNodeIds, isLoggingEnabled);

  // Добавляем обработчик ответов на мультиселект
  // code += generateMultiSelectReplyHandler(nodes || [], allNodeIds, isLoggingEnabled);

  // Альтернативно, можно передавать функции как параметры
  // Ниже приведен обновленный вариант с передачей зависимостей

  return code;
}

/**
 * Расширенная версия функции с передачей зависимостей
 */
export function generateCompleteBotScriptFromNodeGraphWithDependencies(
  code: string,
  multiSelectNodes: any[],
  allNodeIds: any[],
  isLoggingEnabled: () => boolean,
  nodes: any[] | undefined,
  generateMultiSelectCallbackLogic: (nodes: any[], allNodeIds: any[], isLoggingEnabled: () => boolean) => string,
  generateMultiSelectDoneHandler: (nodes: any[], multiSelectNodes: any[], allNodeIds: any[], isLoggingEnabled: () => boolean) => string,
  generateMultiSelectReplyHandler: (nodes: any[], allNodeIds: any[], isLoggingEnabled: () => boolean) => string
): string {
  code += '        return\n';
  code += '    \n';

  // Добавляем логику обработки мультиселекта
  code += generateMultiSelectCallbackLogic(multiSelectNodes, allNodeIds, isLoggingEnabled);

  // Добавляем обработчик завершения мультиселекта
  code += generateMultiSelectDoneHandler(nodes || [], multiSelectNodes, allNodeIds, isLoggingEnabled);

  // Добавляем обработчик ответов на мультиселект
  code += generateMultiSelectReplyHandler(nodes || [], allNodeIds, isLoggingEnabled);

  // Добавляем точку входа для запуска приложения
  code += 'if __name__ == "__main__":\n';
  code += '    asyncio.run(main())\n';

  return code;
}