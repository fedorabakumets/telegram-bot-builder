/**
 * @fileoverview Хук для дублирования листа в проекте
 *
 * Предоставляет функцию для создания копии листа с логированием,
 * сохранением в историю и переключением на новый лист.
 *
 * @module UseSheetDuplicate
 */

import { useCallback } from 'react';
import type { BotDataWithSheets } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets/sheets-manager';
import { logSheetDuplicate } from '@/components/editor/properties';
import type { Toast } from '@/hooks/use-toast';

/** Параметры хука useSheetDuplicate */
interface UseSheetDuplicateParams {
  /** Текущие данные проекта с листами */
  botDataWithSheets: BotDataWithSheets | null;
  /** Функция обновления данных листов */
  setBotDataWithSheets: (data: BotDataWithSheets) => void;
  /** Функция установки данных бота на холсте */
  setBotData: (data: { nodes: any[] }, name?: string, sizes?: any, skipLayout?: boolean) => void;
  /** Функция логирования действий */
  handleActionLog: (type: string, description: string) => void;
  /** Функция сохранения в историю */
  saveToHistory: () => void;
  /** Функция мутации сохранения проекта */
  updateProjectMutation: { mutate: (variables?: any) => void };
  /** Функция toast для уведомлений */
  toast: (props: Toast) => void;
  /** Текущие узлы */
  nodes: any[];
  /** Текущие размеры узлов */
  currentNodeSizes: any;
}

/**
 * Хук для дублирования листа в проекте
 *
 * @param params - Параметры хука
 * @returns Объект с функцией handleSheetDuplicate
 */
export function useSheetDuplicate(params: UseSheetDuplicateParams) {
  const {
    botDataWithSheets,
    setBotDataWithSheets,
    setBotData,
    handleActionLog,
    saveToHistory,
    updateProjectMutation,
    toast,
    nodes,
    currentNodeSizes,
  } = params;

  /**
   * Обработчик дублирования листа
   *
   * @param sheetId - ID листа для дублирования
   */
  const handleSheetDuplicate = useCallback((sheetId: string) => {
    if (!botDataWithSheets) return;

    try {
      // Находим оригинальный лист для логирования
      const originalSheet = botDataWithSheets.sheets.find(s => s.id === sheetId);

      // Логируем ДО изменений
      if (originalSheet) {
        logSheetDuplicate({
          originalName: originalSheet.name,
          newName: `${originalSheet.name} (копия)`,
          onActionLog: handleActionLog,
        });
      }

      // Сохраняем в историю ДО изменений
      saveToHistory();

      const updatedData = SheetsManager.duplicateSheetInProject(botDataWithSheets, sheetId);
      setBotDataWithSheets(updatedData);

      // Переключаемся на дублированный лист
      const newSheet = SheetsManager.getActiveSheet(updatedData);
      if (newSheet) {
        // При дублировании листа всегда применяем автоиерархию
        setBotData({ nodes: newSheet.nodes }, undefined, currentNodeSizes, false);
      }

      // Сохраняем изменения
      updateProjectMutation.mutate();

      toast({
        title: 'Лист дублирован',
        description: 'Лист успешно дублирован',
      });
    } catch (error) {
      toast({
        title: 'Ошибка дублирования',
        description: 'Не удалось дублировать лист',
        variant: 'destructive',
      });
    }
  }, [botDataWithSheets, setBotData, setBotDataWithSheets, handleActionLog, saveToHistory, updateProjectMutation, toast, nodes, currentNodeSizes]);

  return { handleSheetDuplicate };
}
