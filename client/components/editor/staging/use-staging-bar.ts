/**
 * @fileoverview Хук универсальной панели изменений редактора
 * Объединяет состояния canvas и JSON режимов в единый интерфейс
 */

import { useMemo, useCallback } from 'react';
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
  /** Колбэк сохранения с перезапуском ботов сценария */
  onSaveAndRestart: () => void;
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
  /** Колбэк сохранения с перезапуском ботов сценария */
  onSaveAndRestart: () => void;
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
  /** Текущий режим редактора */
  mode: 'canvas' | 'json';
  /** Есть ли несохранённые изменения на холсте (для предупреждения о конфликте) */
  hasLocalChanges: boolean;
  /** Есть ли несохранённые изменения в JSON (для предупреждения о конфликте) */
  isDirty: boolean;
}

/**
 * Хук универсальной панели изменений
 * Вычисляет видимость, вариант и колбэки для StagingBar
 * @param options - Параметры обоих режимов редактора
 * @returns Единое состояние для отображения панели
 */
export function useStagingBar(options: UseStagingBarOptions): UseStagingBarResult {
  const {
    hasLocalChanges, actionHistory, onSave, onSaveAndRestart, onDiscard, isSaving,
    isDirty, jsonError, onApplyJson, onResetJson, mode,
  } = options;

  const variant = useMemo<StagingVariant>(() => {
    if (mode === 'json') {
      if (jsonError) return 'json-error';
      if (isDirty) return 'json-dirty';
      return 'canvas'; // hasLocalChanges из холста
    }
    return 'canvas';
  }, [mode, jsonError, isDirty]);

  const isVisible = useMemo(() => {
    if (mode === 'canvas') return hasLocalChanges;
    return isDirty || !!jsonError || hasLocalChanges;
  }, [mode, hasLocalChanges, isDirty, jsonError]);

  /**
   * В json-dirty режиме сначала применяет JSON, затем сохраняет.
   * В canvas режиме — просто сохраняет.
   */
  const handleSave = useCallback(() => {
    if (mode === 'json' && isDirty) {
      onApplyJson();
    }
    onSave();
  }, [mode, isDirty, onApplyJson, onSave]);

  /**
   * В json-dirty режиме сначала применяет JSON, затем сохраняет и перезапускает.
   * В canvas режиме — просто сохраняет и перезапускает.
   */
  const handleSaveAndRestart = useCallback(() => {
    if (mode === 'json' && isDirty) {
      onApplyJson();
    }
    onSaveAndRestart();
  }, [mode, isDirty, onApplyJson, onSaveAndRestart]);

  return {
    isVisible,
    variant,
    changesCount: actionHistory.length,
    onSave: handleSave,
    onSaveAndRestart: handleSaveAndRestart,
    onDiscard,
    isSaving,
    onApplyJson,
    onResetJson,
    jsonError,
    mode,
    hasLocalChanges,
    isDirty,
  };
}
