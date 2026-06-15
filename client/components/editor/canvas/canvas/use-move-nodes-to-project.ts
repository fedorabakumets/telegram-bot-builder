/**
 * @fileoverview Хук группового переноса узлов в ДРУГОЙ проект (в новый лист).
 * @module canvas/use-move-nodes-to-project
 */

import { useCallback } from 'react';
import { BotDataWithSheets } from '@shared/schema';
import { apiRequest, queryClient } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';
import { createSheet } from '@/utils/sheets/sheet-crud';
import { clearExternalNodeReferences } from '@/utils/sheets/clear-external-references';
import { updateNodeReferencesInData } from '@/utils/sheets/sheet-node-references';
import { generateNewId } from '@/components/editor/canvas/canvas/utils/extract-base-id';

/** Минимальное описание проекта для переноса */
interface ProjectRef {
  /** Идентификатор проекта */
  id: number;
  /** Имя проекта */
  name: string;
  /** Данные проекта с листами (через `as any`) */
  data?: unknown;
}

/** Параметры хука переноса узлов в другой проект */
interface UseMoveNodesToProjectParams {
  /** Идентификатор текущего (открытого) проекта */
  projectId?: number;
  /** Данные текущего проекта с листами */
  botData?: BotDataWithSheets;
  /** Колбэк обновления данных текущего проекта */
  onBotDataUpdate?: (data: BotDataWithSheets) => void;
  /** Список всех проектов (источник для поиска целевого) */
  projects: ProjectRef[];
}

/**
 * Хук переноса выделенных узлов из активного листа текущего проекта в НОВЫЙ
 * лист выбранного целевого проекта.
 *
 * Целевой проект сохраняется на сервер (PUT) и его кэш обновляется. Исходный
 * проект обновляется только локально через `onBotDataUpdate` — он сохранится
 * штатным потоком сохранения открытого редактора (как при переносе в лист).
 *
 * @param params - Параметры хука
 * @returns Объект с функцией `moveNodesToProject`
 */
export function useMoveNodesToProject({
  projectId,
  botData,
  onBotDataUpdate,
  projects,
}: UseMoveNodesToProjectParams) {
  const { toast } = useToast();

  /**
   * Переносит выделенные узлы в новый лист целевого проекта.
   *
   * @param nodeIds - Идентификаторы переносимых узлов
   * @param targetProjectId - Идентификатор целевого проекта
   */
  const moveNodesToProject = useCallback(async (nodeIds: string[], targetProjectId: number) => {
    // Проверки наличия всех данных и валидности переноса
    if (!botData || !onBotDataUpdate || !projectId) return;
    if (nodeIds.length === 0 || targetProjectId === projectId) return;
    const activeSheetId = botData.activeSheetId;
    if (!activeSheetId) return;
    const activeSheet = botData.sheets.find(s => s.id === activeSheetId);
    if (!activeSheet) return;
    const targetProject = projects.find(p => p.id === targetProjectId);
    if (!targetProject) return;
    const targetData = targetProject.data as any;
    if (!targetData?.sheets) return;

    const idSet = new Set(nodeIds);
    const movingNodes = activeSheet.nodes.filter(n => idSet.has(n.id));
    if (movingNodes.length === 0) return;
    // Идентификаторы узлов, остающихся на исходном листе
    const remainingIds = new Set(
      activeSheet.nodes.filter(n => !idSet.has(n.id)).map(n => n.id)
    );

    try {
      // Карта старый id → новый id (чтобы избежать коллизий в целевом проекте)
      const idMap = new Map<string, string>();
      movingNodes.forEach(n => idMap.set(n.id, generateNewId(n.id, 'moved')));

      // Готовим клоны узлов для целевого проекта:
      // 1) обрываем ссылки на неперемещённые узлы, 2) переназначаем id,
      // 3) перенаправляем внутренние ссылки между перемещёнными узлами.
      const clonedNodes = movingNodes.map(n => {
        const cleaned = clearExternalNodeReferences(n.data, idSet);
        const remapped = updateNodeReferencesInData(cleaned, idMap);
        return { ...JSON.parse(JSON.stringify(n)), id: idMap.get(n.id)!, data: remapped };
      });

      // Имя исходного проекта для названия нового листа
      const sourceName = projects.find(p => p.id === projectId)?.name || 'проект';
      const newSheet = createSheet(`Перенесено из «${sourceName}»`, clonedNodes);

      // Глубоко копируем листы целевого проекта и добавляем новый лист
      const targetSheets = JSON.parse(JSON.stringify(targetData.sheets));
      targetSheets.push(newSheet);
      const newTargetData = { ...targetData, sheets: targetSheets };

      // Сохраняем ЦЕЛЕВОЙ проект и обновляем кэши (как onMoveSheetToProject)
      await apiRequest('PUT', `/api/projects/${targetProjectId}`, { data: newTargetData });
      const currentProjects = (queryClient.getQueryData(['/api/projects']) as any[]) || projects;
      const updatedProjects = currentProjects.map((p: any) =>
        p.id === targetProjectId ? { ...p, data: newTargetData } : p
      );
      queryClient.setQueryData(['/api/projects'], updatedProjects);
      queryClient.setQueryData([`/api/projects/${targetProjectId}`], { ...targetProject, data: newTargetData });

      // Обновляем ИСХОДНЫЙ проект локально: убираем перемещённые узлы и
      // обрываем ссылки оставшихся узлов на перемещённые.
      const updatedSheets = botData.sheets.map(sheet => {
        if (sheet.id !== activeSheetId) return sheet;
        const remainingNodes = sheet.nodes
          .filter(n => !idSet.has(n.id))
          .map(n => ({ ...n, data: clearExternalNodeReferences(n.data, remainingIds) }));
        return { ...sheet, nodes: remainingNodes };
      });
      onBotDataUpdate({ ...botData, sheets: updatedSheets });

      toast({
        title: '✅ Узлы перенесены',
        description: `${movingNodes.length} узл. → "${targetProject.name}"`,
      });
    } catch (error: any) {
      toast({ title: '❌ Ошибка', description: error.message, variant: 'destructive' });
    }
  }, [botData, onBotDataUpdate, projectId, projects, toast]);

  return { moveNodesToProject };
}
