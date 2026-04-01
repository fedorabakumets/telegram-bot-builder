/**
 * @fileoverview Хук массового перемещения узлов между листами одного проекта
 * @module components/editor/sidebar/hooks/use-bulk-move-nodes
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BotProject } from '@shared/schema';
import { apiRequest } from '@/queryClient';

/**
 * Параметры хука массового перемещения узлов
 */
interface UseBulkMoveNodesParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Обработчик уведомлений */
  toast: (options: { title: string; description: string; variant?: string }) => void;
}

/**
 * Результат хука массового перемещения узлов
 */
export interface UseBulkMoveNodesResult {
  /** Переместить узлы из одного листа в другой */
  bulkMoveNodes: (sourceSheetId: string, nodeIds: string[], targetSheetId: string) => Promise<void>;
}

/**
 * Хук массового перемещения узлов между листами одного проекта
 * @param params - Параметры хука
 * @returns Объект с функцией перемещения узлов
 */
export function useBulkMoveNodes(params: UseBulkMoveNodesParams): UseBulkMoveNodesResult {
  const { projectId, toast } = params;
  const queryClient = useQueryClient();

  /**
   * Перемещает узлы из исходного листа в целевой
   * @param sourceSheetId - Идентификатор исходного листа
   * @param nodeIds - Массив идентификаторов узлов для перемещения
   * @param targetSheetId - Идентификатор целевого листа
   */
  const bulkMoveNodes = useCallback(async (
    sourceSheetId: string,
    nodeIds: string[],
    targetSheetId: string,
  ) => {
    const projects = queryClient.getQueryData<BotProject[]>(['/api/projects']) || [];
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const data = project.data as any;
    if (!data?.sheets) return;

    const sourceSheet = data.sheets.find((s: any) => s.id === sourceSheetId);
    if (!sourceSheet) return;

    const movedNodes = (sourceSheet.nodes || []).filter((n: any) => nodeIds.includes(n.id));

    const updatedSheets = data.sheets.map((sheet: any) => {
      if (sheet.id === sourceSheetId) {
        return { ...sheet, nodes: (sheet.nodes || []).filter((n: any) => !nodeIds.includes(n.id)) };
      }
      if (sheet.id === targetSheetId) {
        return { ...sheet, nodes: [...(sheet.nodes || []), ...movedNodes] };
      }
      return sheet;
    });

    const newData = { ...data, sheets: updatedSheets };

    try {
      await apiRequest('PUT', `/api/projects/${projectId}`, { data: newData });
      const updatedProjects = projects.map((p) =>
        p.id === projectId ? { ...p, data: newData } : p
      );
      queryClient.setQueryData(['/api/projects'], updatedProjects);
      queryClient.setQueryData([`/api/projects/${projectId}`], { ...project, data: newData });

      const targetSheet = data.sheets.find((s: any) => s.id === targetSheetId);
      toast({
        title: '✅ Узлы перемещены',
        description: `${movedNodes.length} узл. → "${targetSheet?.name || targetSheetId}"`,
      });
    } catch (error: any) {
      toast({ title: '❌ Ошибка', description: error.message, variant: 'destructive' });
    }
  }, [projectId, queryClient, toast]);

  return { bulkMoveNodes };
}
