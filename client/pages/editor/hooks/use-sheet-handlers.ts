/**
 * @fileoverview Главный хук для управления операциями с листами
 *
 * Объединяет все хуки для операций с листами (add, delete, rename,
 * duplicate, select) в одном месте для удобного использования.
 *
 * @module UseSheetHandlers
 */

import { useSheetAdd } from './use-sheet-add';
import { useSheetDelete } from './use-sheet-delete';
import { useSheetRename } from './use-sheet-rename';
import { useSheetDuplicate } from './use-sheet-duplicate';
import { useSheetSelect } from './use-sheet-select';
import type { BotDataWithSheets } from '@shared/schema';
import type { ToasterToast } from '@/hooks/use-toast';

/** Параметры хука useSheetHandlers */
interface UseSheetHandlersParams {
  /** Текущие данные проекта с листами */
  botDataWithSheets: BotDataWithSheets | null;
  /** Функция обновления данных листов */
  setBotDataWithSheets: (data: BotDataWithSheets) => void;
  /** Функция установки данных бота на холсте */
  setBotData: (data: { nodes: any[] }, name?: string, sizes?: any, skipLayout?: boolean) => void;
  /** Функция получения данных бота с холста */
  getBotData: () => { nodes: any[] };
  /** Функция логирования действий */
  handleActionLog: (type: string, description: string) => void;
  /** Функция сохранения в историю */
  saveToHistory: () => void;
  /** Toast для уведомлений */
  toast: (props: Omit<ToasterToast, 'id'>) => void;
  /** Текущие размеры узлов */
  currentNodeSizes: any;
  /** Текущие узлы */
  nodes: any[];
  /** Колбэк после успешного переключения листа */
  onAfterSelect?: () => void;
}

/** Результат работы хука useSheetHandlers */
interface UseSheetHandlersResult {
  /** Обработчик добавления листа */
  handleSheetAdd: (name: string) => void;
  /** Обработчик удаления листа */
  handleSheetDelete: (sheetId: string) => void;
  /** Обработчик переименования листа */
  handleSheetRename: (sheetId: string, newName: string) => void;
  /** Обработчик дублирования листа */
  handleSheetDuplicate: (sheetId: string) => void;
  /** Обработчик выбора листа */
  handleSheetSelect: (sheetId: string) => void;
}

/**
 * Главный хук для управления операциями с листами
 *
 * @param params - Параметры хука
 * @returns Объект с функциями управления листами
 */
export function useSheetHandlers(params: UseSheetHandlersParams): UseSheetHandlersResult {
  const {
    botDataWithSheets,
    setBotDataWithSheets,
    setBotData,
    getBotData,
    handleActionLog,
    saveToHistory,
    toast,
    currentNodeSizes,
    nodes,
    onAfterSelect,
  } = params;

  const { handleSheetAdd } = useSheetAdd({
    botDataWithSheets,
    setBotDataWithSheets,
    setBotData,
    handleActionLog,
    saveToHistory,
    toast,
    currentNodeSizes,
  });

  const { handleSheetDelete } = useSheetDelete({
    botDataWithSheets,
    setBotDataWithSheets,
    setBotData,
    handleActionLog,
    saveToHistory,
    toast,
    nodes,
  });

  const { handleSheetRename } = useSheetRename({
    botDataWithSheets,
    setBotDataWithSheets,
    handleActionLog,
    saveToHistory,
    toast,
  });

  const { handleSheetDuplicate } = useSheetDuplicate({
    botDataWithSheets,
    setBotDataWithSheets,
    setBotData,
    handleActionLog,
    saveToHistory,
    toast,
    nodes,
    currentNodeSizes,
  });

  const { handleSheetSelect } = useSheetSelect({
    botDataWithSheets,
    getBotData,
    setBotDataWithSheets,
    setBotData,
    toast,
    currentNodeSizes,
    onAfterSelect,
  });

  return {
    handleSheetAdd,
    handleSheetDelete,
    handleSheetRename,
    handleSheetDuplicate,
    handleSheetSelect,
  };
}
