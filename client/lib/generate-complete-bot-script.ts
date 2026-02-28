/**
 * @fileoverview Завершение генерации Python скрипта
 *
 * Модуль добавляет финальные компоненты к сгенерированному коду:
 * - Обработчики множественного выбора
 * - Точку входа main()
 *
 * @module generate-complete-bot-script
 */

/**
 * Расширенная версия функции с передачей зависимостей
 *
 * @param code - Текущий сгенерированный код
 * @param multiSelectNodes - Узлы с множественным выбором
 * @param allNodeIds - Все ID узлов
 * @param isLoggingEnabled - Функция проверки логирования
 * @param nodes - Все узлы
 * @param generateMultiSelectCallbackLogic - Генерация логики callback
 * @param generateMultiSelectDoneHandler - Генерация обработчика завершения
 * @param generateMultiSelectReplyHandler - Генерация обработчика ответов
 * @returns Полный Python код с точкой входа
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
  // Проверяем, есть ли узлы с мультиселектом, прежде чем добавлять логику
  if (multiSelectNodes && multiSelectNodes.length > 0) {
    code += '        return\n';
    code += '    \n';

    // Добавляем логику обработки мультиселекта
    code += generateMultiSelectCallbackLogic(multiSelectNodes, allNodeIds, isLoggingEnabled);

    // Добавляем обработчик завершения мультиселекта
    code += generateMultiSelectDoneHandler(nodes || [], multiSelectNodes, allNodeIds, isLoggingEnabled);

    // Добавляем обработчик ответов на мультиселект
    code += generateMultiSelectReplyHandler(nodes || [], allNodeIds, isLoggingEnabled);
  }

  // Добавляем точку входа для запуска приложения ВСЕГДА
  code += '\n# Точка входа для запуска бота\n';
  code += 'if __name__ == "__main__":\n';
  code += '    asyncio.run(main())\n';

  return code;
}
