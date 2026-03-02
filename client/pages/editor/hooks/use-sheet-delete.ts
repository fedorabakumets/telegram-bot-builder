/**
 * @fileoverview Хук для удаления листа из проекта
 *
 * Предоставляет функцию для удаления листа с логированием,
 * сохранением в историю и переключением на активный лист.
 *
 * @module UseSheetDelete
 */

import { useCallback } from 'react';
import type { BotDataWithSheets } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets-manager';
import { logSheetDelete } from '@/components/editor/properties';
import type { ToasterToast } from '@/hooks/use-toast';

/** Тип уведомления без ID */
type Toast = Omit<ToasterToast, 'id'>;

/** Параметры хука useSheetDelete */
interface UseSheetDeleteParams {
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
}

/**
 * Хук для удаления листа из проекта
 *
 * @param params - Параметры хука
 * @returns Объект с функцией handleSheetDelete
 */
export function useSheetDelete(params: UseSheetDeleteParams) {
  const {
    botDataWithSheets,
    setBotDataWithSheets,
    setBotData,
    handleActionLog,
    saveToHistory,
    updateProjectMutation,
    toast,
    nodes,
  } = params;

  /**
   * Обработчик удаления листа
   *
   * @param sheetId - ID удаляемого листа
   */
  const handleSheetDelete = useCallback((sheetId: string) => {
    if (!botDataWithSheets) return;

    try {
      // Находим лист для логирования
      const sheet = botDataWithSheets.sheets.find(s => s.id === sheetId);

      // Логируем ДО изменений
      if (sheet) {
        logSheetDelete({ sheetName: sheet.name, sheetId, onActionLog: handleActionLog });
      }

      // Сохраняем в историю ДО изменений
      saveToHistory();

      const updatedData = SheetsManager.deleteSheet(botDataWithSheets, sheetId);
      setBotDataWithSheets(updatedData);

      // Переключаемся на активный лист
      const activeSheet = SheetsManager.getActiveSheet(updatedData);
      if (activeSheet) {
        setBotData({ nodes: activeSheet.nodes });
      }

      // Сохраняем изменения
      updateProjectMutation.mutate();

      toast({
        title: 'Лист удален',
        description: 'Лист успешно удален',
      });
    } catch (error) {
      toast({
        title: 'Ошибка удаления',
        description: 'Не удалось удалить лист',
        variant: 'destructive',
      });
    }
  }, [botDataWithSheets, setBotData, setBotDataWithSheets, handleActionLog, saveToHistory, updateProjectMutation, toast, nodes]);

  return { handleSheetDelete };
}
