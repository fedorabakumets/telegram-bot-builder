/** @fileoverview Переключение листов без записи проекта и потери локальных правок. */
import { useCallback } from 'react';
import type { BotData, BotDataWithSheets } from '@shared/schema';
import type { ToasterToast } from '@/hooks/use-toast';
import type { NodeSizeMap } from '../types/node-size';

/** Параметры переключения активного листа. */
interface UseSheetSelectParams {
  /** Текущий черновик проекта. */
  botDataWithSheets: BotDataWithSheets | null;
  /** Читает последние узлы с холста до его переключения. */
  getBotData: () => Pick<BotData, 'nodes'>;
  /** Обновляет локальные данные листов. */
  setBotDataWithSheets: (data: BotDataWithSheets) => void;
  /** Загружает узлы выбранного листа на холст. */
  setBotData: (data: BotData, name?: string, sizes?: NodeSizeMap, skipLayout?: boolean) => void;
  /** Сообщает об отсутствующем листе. */
  toast: (props: Omit<ToasterToast, 'id'>) => void;
  /** Текущие размеры узлов. */
  currentNodeSizes: NodeSizeMap;
  /** Выполняет действия после загрузки листа, например обновляет область просмотра. */
  onAfterSelect?: () => void;
}

/**
 * Переключает лист в локальном состоянии с сохранением правок исходного холста.
 * @param params - Черновик проекта и обработчики холста.
 * @returns Обработчик выбора листа.
 */
export function useSheetSelect({
  botDataWithSheets, getBotData, setBotDataWithSheets, setBotData, toast, currentNodeSizes, onAfterSelect,
}: UseSheetSelectParams) {
  /** @param sheetId - Идентификатор листа назначения. */
  const handleSheetSelect = useCallback((sheetId: string) => {
    if (!botDataWithSheets || sheetId === botDataWithSheets.activeSheetId) return;
    const nextSheet = botDataWithSheets.sheets.find((sheet) => sheet.id === sheetId);
    if (!nextSheet) {
      toast({ title: 'Лист не найден', description: 'Остались на текущем листе.', variant: 'destructive' });
      return;
    }

    const { nodes } = getBotData();
    const sheets = botDataWithSheets.sheets.map((sheet) =>
      sheet.id === botDataWithSheets.activeSheetId && sheet.nodes !== nodes ? { ...sheet, nodes } : sheet,
    );
    setBotDataWithSheets({ ...botDataWithSheets, sheets, activeSheetId: sheetId });
    setBotData({ nodes: nextSheet.nodes }, undefined, currentNodeSizes, true);
    onAfterSelect?.();
  }, [botDataWithSheets, getBotData, setBotDataWithSheets, setBotData, toast, currentNodeSizes, onAfterSelect]);

  return { handleSheetSelect };
}
