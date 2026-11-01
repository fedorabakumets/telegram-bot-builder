/** @fileoverview Хранилище черновиков, независимое от видимости строки в сетке. */
/** Состояние редактирования ячейки. */
export interface CellDraft {
  /** Введённый текст. */
  draft: string;
  /** Значение перед началом редактирования. */
  baseline: string;
  /** Запрос сохранения выполняется. */
  pending: boolean;
  /** Ошибка последнего запроса. */
  error: string;
  /** Последний запрос подтверждён сервером. */
  saved: boolean;
}
/**
 * Создаёт подписки на отдельные ячейки без перерисовки всех строк при вводе текста.
 * @returns Хранилище черновиков текущей таблицы.
 */
export function createCellDraftStore() {
  const values = new Map<string, CellDraft>();
  const listeners = new Map<string, Set<() => void>>();
  /** Возвращает стабильный снимок, создавая его при первом обращении. */
  function get(key: string, value: string) {
    if (!values.has(key)) values.set(key, { draft: value, baseline: value, pending: false, error: '', saved: false });
    return values.get(key)!;
  }
  /** Меняет поля черновика и уведомляет только соответствующую ячейку. */
  function patch(key: string, delta: Partial<CellDraft>) {
    const current = values.get(key); if (!current) return;
    values.set(key, { ...current, ...delta }); listeners.get(key)?.forEach((listener) => listener());
  }
  /** Подписывает отображаемую ячейку на её собственные изменения. */
  function subscribe(key: string, listener: () => void) {
    const set = listeners.get(key) ?? new Set(); set.add(listener); listeners.set(key, set);
    return () => { set.delete(listener); if (!set.size) listeners.delete(key); };
  }
  return { get, patch, subscribe };
}
/** Контракт независимого хранилища черновиков. */
export type CellDraftStore = ReturnType<typeof createCellDraftStore>;
