/**
 * @fileoverview Утилита извлечения узла из проекта
 * 
 * Ищет узел по ID в структуре проекта с листами.
 */

import { BotProject } from "@shared/schema";

/**
 * Узел проекта
 */
export interface ProjectNode {
  /** ID узла */
  id: string;
  /** Тип узла */
  type: string;
  /** Данные узла */
  data: Record<string, unknown>;
}

/**
 * Извлекает узел из данных проекта по ID
 * 
 * @param project - Проект бота
 * @param nodeId - ID узла для поиска
 * @returns Найденный узел или undefined
 */
export function extractNodeFromProject(
  project: BotProject,
  nodeId: string
): ProjectNode | undefined {
  const projectData = project.data as {
    sheets?: Array<{ nodes?: Array<{ id: string; type: string; data: Record<string, unknown> }> }>;
  };

  for (const sheet of projectData.sheets || []) {
    const found = sheet.nodes?.find(n => n.id === nodeId);
    if (found) {
      return found as ProjectNode;
    }
  }

  return undefined;
}
