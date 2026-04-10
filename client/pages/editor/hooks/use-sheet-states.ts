/**
 * @fileoverview Хук состояний листов редактора
 *
 * Управляет состояниями системы листов и истории.
 *
 * @module UseSheetStates
 */

import { useState } from 'react';
import type { BotDataWithSheets } from '@shared/schema';
import type { NodeSizeMap } from '../types/node-size';
import type { ActionHistoryItem } from '../types/action-history-item';
import type { Dispatch, SetStateAction } from 'react';

/** Результат работы хука useSheetStates */
export interface UseSheetStatesResult {
  /** Данные проекта с листами */
  botDataWithSheets: BotDataWithSheets | null;
  /** Размеры узлов */
  currentNodeSizes: NodeSizeMap;
  /** История действий */
  actionHistory: ActionHistoryItem[];
  /** ID последнего загруженного проекта */
  lastLoadedProjectId: number | null;
  /** Флаг локальных изменений */
  hasLocalChanges: boolean;
  /** Установить botDataWithSheets */
  setBotDataWithSheets: (data: BotDataWithSheets | null) => void;
  /** Установить currentNodeSizes */
  setCurrentNodeSizes: (sizes: NodeSizeMap) => void;
  /** Установить actionHistory */
  setActionHistory: Dispatch<SetStateAction<ActionHistoryItem[]>>;
  /** Установить lastLoadedProjectId */
  setLastLoadedProjectId: (id: number | null) => void;
  /** Установить hasLocalChanges */
  setHasLocalChanges: (has: boolean) => void;
}

/**
 * Хук для управления состояниями листов
 *
 * @returns Объект с состояниями и сеттерами
 */
export function useSheetStates(): UseSheetStatesResult {
  const [botDataWithSheets, setBotDataWithSheets] = useState<BotDataWithSheets | null>(null);
  const [currentNodeSizes, setCurrentNodeSizes] = useState<NodeSizeMap>(new Map());
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  const [lastLoadedProjectId, setLastLoadedProjectId] = useState<number | null>(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  return {
    botDataWithSheets,
    currentNodeSizes,
    actionHistory,
    lastLoadedProjectId,
    hasLocalChanges,
    setBotDataWithSheets,
    setCurrentNodeSizes,
    setActionHistory,
    setLastLoadedProjectId,
    setHasLocalChanges,
  };
}
