/**
 * @fileoverview Хук для переименования листа в проекте
 *
 * Предоставляет функцию для переименования листа с логированием
 * и сохранением изменений в проекте.
 *
 * @module UseSheetRename
 */

import { useCallback } from 'react';
import type { BotDataWithSheets } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets/sheets-manager';
import { logSheetRename } from '@/components/editor/properties';
import type { Toast } from '@/hooks/use-toast';

/** Параметры хука useSheetRename */
interface UseSheetRenameParams {
  /** Текущие данные проекта с листами */
  botDataWithSheets: BotDataWithSheets | null;
  /** Функция обновления данных листов */
  setBotDataWithSheets: (data: BotDataWithSheets) => void;
  /** Функция логирования действий */
  handleActionLog: (type: string, description: string) => void;
  /** Функция сохранения в историю */
  saveToHistory: () => void;
  /** Функция мутации сохранения проекта */
  updateProjectMutation: { mutate: (variables?: any) => void };
  /** Функция toast для уведомлений */
  toast: (props: Toast) => void;
}

/**
 * Хук для переименования листа в проекте
 *
 * @param params - Параметры хука
 * @returns Объект с функцией handleSheetRename
 */
export function useSheetRename(params: UseSheetRenameParams) {
  const {
    botDataWithSheets,
    setBotDataWithSheets,
    handleActionLog,
    saveToHistory,
    updateProjectMutation,
    toast,
  } = params;

  /**
   * Обработчик переименования листа
   *
   * @param sheetId - ID листа
   * @param newName - Новое название листа
   */
  const handleSheetRename = useCallback((sheetId: string, newName: string) => {
    if (!botDataWithSheets) return;

    try {
      // Находим лист для логирования
      const sheet = botDataWithSheets.sheets.find(s => s.id === sheetId);

      // Логируем ДО изменений
      if (sheet) {
        logSheetRename({
          sheetId,
          oldName: sheet.name,
          newName,
          onActionLog: handleActionLog,
        });
      }

      // Сохраняем в историю ДО изменений
      saveToHistory();

      const updatedData = SheetsManager.renameSheet(botDataWithSheets, sheetId, newName);
      setBotDataWithSheets(updatedData);

      // Сохраняем изменения
      updateProjectMutation.mutate();

      toast({
        title: 'Лист переименован',
        description: `Лист переименован в "${newName}"`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка переименования',
        description: 'Не удалось переименовать лист',
        variant: 'destructive',
      });
    }
  }, [botDataWithSheets, setBotDataWithSheets, handleActionLog, saveToHistory, updateProjectMutation, toast]);

  return { handleSheetRename };
}
