/**
 * @fileoverview Утилиты для работы с узлами проекта
 * @description Помощники для получения и форматирования узлов
 */

import type { Node } from '@shared/schema';

/**
 * Узел с информацией о листе
 */
export interface NodeWithSheet {
  /** Узел проекта */
  node: Node;
  /** Идентификатор листа */
  sheetId: string;
  /** Название листа */
  sheetName: string;
}

/**
 * Получает все узлы из данных проекта
 * @param projectData - Данные проекта (с sheets или nodes)
 * @returns Массив узлов с информацией о листе
 */
export function collectNodesFromProjectData(
  projectData: Record<string, unknown> | null
): NodeWithSheet[] {
  const result: NodeWithSheet[] = [];

  if (!projectData) return result;

  // Новый формат с sheets
  if (projectData.sheets && Array.isArray(projectData.sheets)) {
    const sheets = projectData.sheets as Array<{ id: string; name: string; nodes?: unknown[] }>;
    sheets.forEach((sheet) => {
      if (sheet.nodes && Array.isArray(sheet.nodes)) {
        sheet.nodes.forEach((node) => {
          result.push({
            node: node as Node,
            sheetId: sheet.id,
            sheetName: sheet.name || 'Лист',
          });
        });
      }
    });
  }
  // Старый формат с nodes
  else if (projectData.nodes && Array.isArray(projectData.nodes)) {
    (projectData.nodes as Node[]).forEach((node) => {
      result.push({
        node,
        sheetId: 'current',
        sheetName: 'Текущий лист',
      });
    });
  }

  return result;
}

/**
 * Форматирует отображение узла
 * @param node - Узел для форматирования
 * @param sheetName - Название листа
 * @returns Строка отображения
 */
export function formatNodeDisplay(node: Node, sheetName: string): string {
  const typeLabels: Record<string, string> = {
    start: 'Старт',
    message: 'Сообщение',
    command: 'Команда',
    sticker: 'Стикер',
    voice: 'Голосовое',
    animation: 'Анимация',
    location: 'Геолокация',
    contact: 'Контакт',
  };

  const label = typeLabels[node.type] || 'Узел';
  const text = node.data.messageText || node.data.command || '';
  
  // Показываем текст сообщения и название листа
  if (text) {
    return `${label}: ${text} (${sheetName})`;
  }
  return `${label} (${sheetName})`;
}
