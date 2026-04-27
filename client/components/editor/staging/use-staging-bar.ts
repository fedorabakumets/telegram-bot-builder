/**
 * @fileoverview Хук универсальной панели изменений редактора
 * Объединяет состояния canvas и JSON режимов в единый интерфейс
 */

import { useMemo } from 'react';
import type { ActionHistoryItem } from '@/pages/editor/types/action-history-item';

/** Вариант отображения панели */
export type StagingVariant = 'canvas' | 'json-dirty' | 'json-error';

/** Параметры хука useStagingBar */
export interface UseStagingBarOptions {
  // --- Canvas режим ---
  /** Есть ли локальные несохранённые изменения на холсте */
  hasLocalChanges: boolean;
  /** История действий пользователя */
  actionHistory: ActionHistoryItem[];
  /** Колбэк сохранения изменений холста */
  onSave: () => void;
  /** Колбэк сброса изменений холста */
  onDiscard: () => void;
  /** Идёт ли сохранение в данный момент */
  isSaving: boolean;
  // --- JSON режим ---
  /** Есть ли несохранённые изменения в JSON-редакторе */
  isDirty: boolean;
  /** Текст ошибки валидации JSON или null */
  jsonError: string | null;
  /** Колбэк применения JSON */
  onApplyJson: () => void;
  /** Колбэк сброса JSON к исходному состоянию */
  onResetJson: () => void;
  // --- Общее ---
  /** Текущий активный режим редактора */
  mode: 'canvas' | 'json';
}

/** Результат хука useStagingBar */
export interface UseStagingBarResult {
  /** Показывать ли панель */
  isVisible: boolean;
  /** Вариант отображения панели */
  variant: StagingVariant;
  /** Количество действий в истории */
  changesCount: number;
  /** Колбэк сохранения (canvas) */
  onSave: () => void;
  /** Колбэк сброса (canvas) */
  onDiscard: () => void;
  /** Идёт ли сохранение */
  isSaving: boolean;
  /** Колбэк применения JSON */
  onApplyJson: () => void;
  /** Колбэк сброса JSON */
  onResetJson: () => void;
  /** Текст ошибки JSON */
  jsonError: string | null;
}

/**
 * Хук универсальной панели изменений
 * Вычисляет видимость, вариант и колбэки для StagingBar
 * @param options - Параметры обоих режимов редактора
 * @returns Единое состояние для отображения панели
 */
export function useStagingBar(options: UseStagingBarOptions): UseStagingBarResult {
  const {
    hasLocalChanges, actionHistory, onSave, onDiscard, isSaving,
    isDirty, jsonError, onApplyJson, onResetJson, mode,
  } = options;

  const variant = useMemo<StagingVariant>(() => {
    if (mode === 'json') return jsonError ? 'json-error' : 'json-dirty';
    return 'canvas';
  }, [mode, jsonError]);

  const isVisible = useMemo(() => {
    if (mode === 'canvas') return hasLocalChanges;
    return isDirty || !!jsonError;
  }, [mode, hasLocalChanges, isDirty, jsonError]);

  return {
    isVisible,
    variant,
    changesCount: actionHistory.length,
    onSave,
    onDiscard,
    isSaving,
    onApplyJson,
    onResetJson,
    jsonError,
  };
}
