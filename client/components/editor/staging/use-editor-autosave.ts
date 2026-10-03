/**
 * @fileoverview Автосохранение холста и JSON после паузы в правках
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { readAutosaveEnabled, writeAutosaveEnabled } from './autosave-preference';

/** Пауза перед записью, чтобы сдвиг узла не слал запрос на каждый кадр */
const AUTOSAVE_DELAY_MS = 700;

/** Параметры автосохранения */
interface UseEditorAutosaveOptions {
  /** Есть несохранённые правки холста */
  hasLocalChanges: boolean;
  /** Идёт запрос сохранения */
  isSaving: boolean;
  /** Активный режим редактора */
  mode: 'canvas' | 'json';
  /** Идентификатор последнего действия — сдвигает паузу */
  latestActionId: string | null;
  /** Сохранить текущие правки */
  onSave: () => void;
}

/**
 * Хранит галочку автосохранения и вызывает сохранение после паузы
 * @param options - Состояние правок и колбэк сохранения
 * @returns Флаг и переключатель
 */
export function useEditorAutosave({
  hasLocalChanges,
  isSaving,
  mode,
  latestActionId,
  onSave,
}: UseEditorAutosaveOptions) {
  const [autosave, setAutosaveState] = useState(readAutosaveEnabled);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  /** Действие, которое уже ушло в запрос сохранения */
  const savedActionIdRef = useRef<string | null>(null);
  const latestActionIdRef = useRef(latestActionId);
  latestActionIdRef.current = latestActionId;

  const setAutosave = useCallback((enabled: boolean) => {
    setAutosaveState(enabled);
    writeAutosaveEnabled(enabled);
  }, []);

  useEffect(() => {
    if (!autosave || isSaving || mode !== 'canvas') return;
    const dirty = hasLocalChanges;
    const changedDuringSave = savedActionIdRef.current != null
      && latestActionId != null
      && latestActionId !== savedActionIdRef.current;
    if (!dirty && !changedDuringSave) return;

    const timer = window.setTimeout(() => {
      savedActionIdRef.current = latestActionIdRef.current;
      onSaveRef.current();
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [autosave, hasLocalChanges, isSaving, mode, latestActionId]);

  return { autosave, setAutosave };
}
