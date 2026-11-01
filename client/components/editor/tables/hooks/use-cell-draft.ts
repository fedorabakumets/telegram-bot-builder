/** @fileoverview Подписка ячейки на сохраняемый при фильтрации и виртуализации черновик. */
import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { CellDraftStore, CellDraft } from './cell-draft-store';
/** Контекст одной таблицы; переключение строк не удаляет черновики. */
export const CellDraftContext = createContext<CellDraftStore | null>(null);
/**
 * Возвращает черновик и обновляет его исходные данные только при отсутствии локальных правок.
 * @param key - Идентификаторы строки и столбца.
 * @param value - Актуальное значение с сервера.
 * @returns Состояние и обновление отдельных полей черновика.
 */
export function useCellDraft(key: string, value: string): [CellDraft, (delta: Partial<CellDraft>) => void] {
  const store = useContext(CellDraftContext);
  if (!store) throw new Error('Редактор ячейки должен находиться внутри таблицы');
  const snapshot = useSyncExternalStore((listener) => store.subscribe(key, listener), () => store.get(key, value));
  useEffect(() => {
    if (snapshot.draft === snapshot.baseline && !snapshot.pending && value !== snapshot.baseline) store.patch(key, { draft: value, baseline: value });
  }, [store, key, value, snapshot]);
  return [snapshot, (delta) => store.patch(key, delta)];
}
