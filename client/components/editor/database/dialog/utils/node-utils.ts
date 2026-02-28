/**
 * @fileoverview Утилиты для работы с узлами проекта
 * @description Помощники для получения узлов из данных проекта
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
