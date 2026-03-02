/**
 * @fileoverview Хук для переключения между листами в проекте
 *
 * Предоставляет функцию для выбора активного листа с сохранением
 * текущих данных холста и логированием действий.
 *
 * @module UseSheetSelect
 */

import { useCallback } from 'react';
import type { BotDataWithSheets } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets-manager';
import { logSheetSwitch } from '@/components/editor/properties';
import type { Toast, ToasterToast } from '@/hooks/use-toast';
import type { QueryClient } from '@tanstack/react-query';

/** Параметры хука useSheetSelect */
interface UseSheetSelectParams {
  /** Текущие данные проекта с листами */
  botDataWithSheets: BotDataWithSheets | null;
  /** Функция получения данных бота с холста */
  getBotData: () => { nodes: any[] };
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
  /** Toast для уведомлений */
  toast: (props: Omit<ToasterToast, 'id'>) => void;
  /** QueryClient для инвалидации кэша */
  queryClient: QueryClient;
  /** Текущие размеры узлов */
  currentNodeSizes: any;
  /** ID активного проекта */
  activeProjectId: number | null;
}

/**
 * Хук для переключения между листами в проекте
 *
 * @param params - Параметры хука
 * @returns Объект с функцией handleSheetSelect
 */
export function useSheetSelect(params: UseSheetSelectParams) {
  const {
    botDataWithSheets,
    getBotData,
    setBotDataWithSheets,
    setBotData,
    handleActionLog,
    saveToHistory,
    updateProjectMutation,
    toast,
    queryClient,
    currentNodeSizes,
    activeProjectId,
  } = params;

  /**
   * Обработчик выбора листа
   *
   * @param sheetId - ID выбираемого листа
   */
  const handleSheetSelect = useCallback((sheetId: string) => {
    if (!botDataWithSheets) return;

    try {
      // Находим текущий и новый листы для логирования
      const currentSheet = botDataWithSheets.sheets.find(
        s => s.id === botDataWithSheets.activeSheetId
      );
      const newSheet = botDataWithSheets.sheets.find(s => s.id === sheetId);

      // Логируем ДО изменений
      if (newSheet) {
        logSheetSwitch({
          fromSheet: currentSheet?.name,
          toSheet: newSheet.name,
          onActionLog: handleActionLog,
        });
      }

      // Сохраняем в историю ДО изменений
      saveToHistory();

      // Проверяем существование листа
      const sheetExists = botDataWithSheets.sheets.some(sheet => sheet.id === sheetId);
      if (!sheetExists) {
        console.warn(`Лист ${sheetId} не найден в проекте`);

        // Переключаемся на первый доступный лист
        if (botDataWithSheets.sheets.length > 0) {
          const firstSheet = botDataWithSheets.sheets[0];
          const updatedData = SheetsManager.setActiveSheet(botDataWithSheets, firstSheet.id);
          setBotDataWithSheets(updatedData);

          const newActiveSheet = SheetsManager.getActiveSheet(updatedData);
          if (newActiveSheet) {
            setBotData({ nodes: newActiveSheet.nodes }, undefined, currentNodeSizes, false);
          }

          if (activeProjectId) {
            updateProjectMutation.mutate();
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: [`/api/projects/${activeProjectId}`] });
              queryClient.refetchQueries({ queryKey: [`/api/projects/${activeProjectId}`] });
            }, 100);
          }
        }

        toast({
          title: 'Лист был удален',
          description: 'Переключились на другой лист',
          variant: 'destructive',
        });
        return;
      }

      // Сохраняем текущие данные холста в активном листе
      const currentCanvasData = getBotData();
      const activeSheetId = botDataWithSheets.activeSheetId;
      const updatedSheets = botDataWithSheets.sheets.map(sheet =>
        sheet.id === activeSheetId
          ? { ...sheet, nodes: currentCanvasData.nodes, updatedAt: new Date() }
          : sheet
      );

      // Переключаемся на новый лист
      const updatedData = SheetsManager.setActiveSheet(
        { ...botDataWithSheets, sheets: updatedSheets },
        sheetId
      );
      setBotDataWithSheets(updatedData);

      // Загружаем данные нового активного листа
      const newActiveSheet = SheetsManager.getActiveSheet(updatedData);
      if (newActiveSheet) {
        setBotData({ nodes: newActiveSheet.nodes }, undefined, currentNodeSizes, false);
      }

      // Сохраняем изменения
      if (activeProjectId) {
        updateProjectMutation.mutate();
      }
    } catch (error) {
      toast({
        title: 'Ошибка переключения',
        description: 'Не удалось переключиться на лист',
        variant: 'destructive',
      });
    }
  }, [
    botDataWithSheets,
    getBotData,
    setBotData,
    setBotDataWithSheets,
    handleActionLog,
    saveToHistory,
    updateProjectMutation,
    toast,
    queryClient,
    currentNodeSizes,
    activeProjectId,
  ]);

  return { handleSheetSelect };
}
