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
      const sheet = botDataWithSheets.sheets.find(s => s.id === sheetId);
      if (!sheet || sheet.name === newName) return;

      // Логируем ДО изменений
      logSheetRename({ sheetId, oldName: sheet.name, newName, onActionLog: handleActionLog });

      // Сохраняем в историю ДО изменений
      saveToHistory();

      const updatedData = SheetsManager.renameSheet(botDataWithSheets, sheetId, newName);
      setBotDataWithSheets(updatedData);

      /** Черновик сохраняется через общую панель или общий таймер редактора. */

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
  }, [botDataWithSheets, setBotDataWithSheets, handleActionLog, saveToHistory, toast]);

  return { handleSheetRename };
}
