/**
 * @fileoverview Хук для добавления нового листа в проект
 *
 * Предоставляет функцию для создания нового листа с логированием,
 * сохранением в историю и обновлением проекта.
 *
 * @module UseSheetAdd
 */

import { useCallback } from 'react';
import type { BotDataWithSheets } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets/sheets-manager';
import { logSheetAdd } from '@/components/editor/properties';
import type { ToasterToast } from '@/hooks/use-toast';

/** Тип уведомления без ID */
type Toast = Omit<ToasterToast, 'id'>;

/** Параметры хука useSheetAdd */
interface UseSheetAddParams {
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
  /** Текущие размеры узлов */
  currentNodeSizes: any;
}

/**
 * Хук для добавления нового листа в проект
 *
 * @param params - Параметры хука
 * @returns Объект с функцией handleSheetAdd
 */
export function useSheetAdd(params: UseSheetAddParams) {
  const {
    botDataWithSheets,
    setBotDataWithSheets,
    setBotData,
    handleActionLog,
    saveToHistory,
    updateProjectMutation,
    toast,
    currentNodeSizes,
  } = params;

  /**
   * Обработчик добавления нового листа
   *
   * @param name - Название нового листа
   */
  const handleSheetAdd = useCallback((name: string) => {
    if (!botDataWithSheets) return;

    try {
      // Логируем ДО изменений
      logSheetAdd({ sheetName: name, onActionLog: handleActionLog });

      // Сохраняем в историю ДО изменений
      saveToHistory();

      const updatedData = SheetsManager.addSheet(botDataWithSheets, name);
      setBotDataWithSheets(updatedData);

      // Переключаемся на новый лист
      const newSheet = SheetsManager.getActiveSheet(updatedData);
      if (newSheet) {
        // При добавлении нового листа всегда применяем автоиерархию
        setBotData({ nodes: newSheet.nodes }, undefined, currentNodeSizes, false);
      }

      // Сохраняем изменения
      updateProjectMutation.mutate();

      toast({
        title: 'Лист создан',
        description: `Лист "${name}" успешно создан`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка создания',
        description: 'Не удалось создать лист',
        variant: 'destructive',
      });
    }
  }, [botDataWithSheets, setBotData, setBotDataWithSheets, handleActionLog, saveToHistory, updateProjectMutation, toast, currentNodeSizes]);

  return { handleSheetAdd };
}
