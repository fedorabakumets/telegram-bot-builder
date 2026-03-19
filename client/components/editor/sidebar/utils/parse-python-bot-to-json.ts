/**
 * @fileoverview Утилита для парсинга Python кода бота в JSON структуру проекта
 *
 * Этот модуль предоставляет функцию для анализа сгенерированного Python кода
 * и создания структуры проекта с листами (sheets), готовой для использования
 * в редакторе ботов.
 *
 * @module parse-python-bot-to-json
 */

import { parsePythonCodeToJson } from '@lib/bot-generator/format';

/** Результат парсинга Python бота в JSON */
export interface ParsePythonBotResult {
  /** Структура проекта с листами */
  data: {
    /** Массив листов проекта */
    sheets: Array<{
      /** Идентификатор листа */
      id: string;
      /** Название листа */
      name: string;
      /** Узлы на листе */
      nodes: any[];
      /** Соединения между узлами */
      connections: any[];
    }>;
    /** Версия структуры проекта */
    version: number;
    /** Идентификатор активного листа */
    activeSheetId: string;
  };
  /** Количество узлов в боте */
  nodeCount: number;
}

/**
 * Парсит Python код бота в JSON структуру проекта
 *
 * Функция анализирует Python код с маркерами @@NODE_START:@@ и @@NODE_END:@@,
 * извлекает узлы и соединения, затем создаёт структуру проекта с листами.
 *
 * @param pythonCode - Строка с Python кодом бота
 * @returns Объект с структурой проекта и количеством узлов
 *
 * @example
 * const result = parsePythonBotToJson(pythonCode);
 * console.log(`Найдено узлов: ${result.nodeCount}`);
 */
export function parsePythonBotToJson(pythonCode: string): ParsePythonBotResult {
  const { nodes, connections } = parsePythonCodeToJson(pythonCode);

  const projectData = {
    sheets: [
      {
        id: 'main',
        name: 'Импортированный бот',
        nodes: nodes,
        connections: connections
      }
    ],
    version: 2,
    activeSheetId: 'main'
  };

  return {
    data: projectData,
    nodeCount: nodes.length
  };
}
