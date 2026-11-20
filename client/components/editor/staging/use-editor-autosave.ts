/**
 * @fileoverview Автосохранение локального черновика холста после паузы в правках.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { readAutosaveEnabled, writeAutosaveEnabled } from './autosave-preference';

/** Пауза перед записью, чтобы сдвиг узла не слал запрос на каждый кадр */
const AUTOSAVE_DELAY_MS = 700;

/** Исход попытки записи, подтверждённый вызывающим кодом. */
type AutosaveResult = 'saved' | 'failed' | 'conflict';

/** Параметры автосохранения */
interface UseEditorAutosaveOptions {
  /** Идентификатор проекта с загруженным черновиком. */
  projectId?: number;
  /** Текущая рабочая область допускает отправку черновика. */
  enabled: boolean;
  /** Есть несохранённые правки холста */
  hasLocalChanges: boolean;
  /** Идёт запрос сохранения */
  isSaving: boolean;
  /** Активный режим редактора */
  mode: 'canvas' | 'json';
  /** Идентификатор последнего действия — сдвигает паузу */
  latestActionId: string | null;
  /** Номер локального изменения, включая действия без истории. */
  draftRevision?: number;
  /** Сохраняет снимок и возвращает его подтверждённый исход. */
  onSave: () => Promise<AutosaveResult>;
}

/** Учёт попыток строго в пределах одного проекта. */
interface AutosaveSession {
  /** Проект, которому принадлежат попытки. */
  projectId: number;
  /** Черновик, для которого уже запускалась отправка. */
  attemptedDraft?: string | number | null;
  /** Ожидается ответ по одной попытке. */
  pending: boolean;
  /** Последний конфликт требует ручного разрешения. */
  conflict: boolean;
}

/**
 * Хранит галочку автосохранения и вызывает сохранение после паузы
 * @param options - Состояние правок и колбэк сохранения
 * @returns Флаг и переключатель
 */
export function useEditorAutosave({
  projectId,
  enabled,
  hasLocalChanges,
  isSaving,
  mode,
  latestActionId,
  draftRevision,
  onSave,
}: UseEditorAutosaveOptions) {
  const [autosave, setAutosaveState] = useState(readAutosaveEnabled);
  const [settledAttempts, setSettledAttempts] = useState(0);
  const sessionRef = useRef<AutosaveSession | null>(null);
  const draft = draftRevision ?? latestActionId;
  const canSave = autosave && enabled && hasLocalChanges && !isSaving && mode === 'canvas';
  /** Таймер проверяет актуальную область и черновик до вызова сохранения. */
  const currentRef = useRef({ projectId, canSave, draft, onSave });
  currentRef.current = { projectId, canSave, draft, onSave };

  const setAutosave = useCallback((enabled: boolean) => {
    setAutosaveState(enabled);
    writeAutosaveEnabled(enabled);
  }, []);

  useEffect(() => {
    if (projectId == null) {
      sessionRef.current = null;
      return;
    }
    if (sessionRef.current?.projectId !== projectId) {
      sessionRef.current = { projectId, pending: false, conflict: false };
    }
    const session = sessionRef.current;
    if (!hasLocalChanges) {
      // После ручного сохранения или отмены следующий черновик снова допустим.
      session.conflict = false;
      session.attemptedDraft = undefined;
      return;
    }
    if (!canSave || session.pending || session.conflict || session.attemptedDraft === draft) return;

    const timer = window.setTimeout(async () => {
      const current = currentRef.current;
      if (sessionRef.current !== session || !current.canSave
        || current.projectId !== session.projectId || current.draft !== draft) return;
      session.pending = true;
      session.attemptedDraft = draft;
      try {
        if (await current.onSave() === 'conflict' && session.attemptedDraft === draft) {
          session.conflict = true;
        }
      } catch {
        // Повтор возможен после новой правки, а не по тому же черновику.
      } finally {
        session.pending = false;
        if (sessionRef.current === session) setSettledAttempts((attempts) => attempts + 1);
      }
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [projectId, canSave, hasLocalChanges, draft, settledAttempts]);

  useEffect(() => () => { sessionRef.current = null; }, []);

  return { autosave, setAutosave };
}
