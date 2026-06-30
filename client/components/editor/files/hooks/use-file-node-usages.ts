/**
 * @fileoverview Хук поиска нод, в которых используется файл
 * @module components/editor/files/hooks/use-file-node-usages
 */

import { useMemo } from 'react';

/** Информация о ноде, использующей файл */
export interface FileNodeUsage {
  /** ID ноды */
  nodeId: string;
  /** Отображаемое имя ноды */
  nodeLabel: string;
  /** ID листа */
  sheetId: string;
  /** Имя листа */
  sheetName: string;
}

/** Лист с нодами (минимальная типизация) */
interface SheetInfo {
  /** ID листа */
  id: string;
  /** Имя листа */
  name: string;
  /** Массив нод */
  nodes: Array<{ id: string; data: Record<string, any> }>;
}

/**
 * Находит все ноды, использующие данный URL файла
 * @param fileUrl - URL файла для поиска
 * @param sheets - Массив листов с нодами
 * @returns Массив использований файла в нодах
 */
export function findFileUsages(fileUrl: string | null | undefined, sheets: SheetInfo[]): FileNodeUsage[] {
  if (!fileUrl || !sheets?.length) return [];
  const results: FileNodeUsage[] = [];

  for (const sheet of sheets) {
    for (const node of sheet.nodes ?? []) {
      const d = node.data;
      const used =
        (Array.isArray(d.attachedMedia) && d.attachedMedia.includes(fileUrl)) ||
        d.imageUrl === fileUrl || d.videoUrl === fileUrl ||
        d.audioUrl === fileUrl || d.documentUrl === fileUrl;
      if (used) {
        const label = (d.messageText?.slice(0, 30) as string) || node.id;
        results.push({ nodeId: node.id, nodeLabel: label, sheetId: sheet.id, sheetName: sheet.name });
      }
    }
  }
  return results;
}

/**
 * Хук: мемоизированный поиск использований файла в нодах
 * @param fileUrl - URL файла
 * @param sheets - Массив листов
 * @returns Массив использований
 */
export function useFileNodeUsages(fileUrl: string | null | undefined, sheets: SheetInfo[]): FileNodeUsage[] {
  return useMemo(() => findFileUsages(fileUrl, sheets), [fileUrl, sheets]);
}
