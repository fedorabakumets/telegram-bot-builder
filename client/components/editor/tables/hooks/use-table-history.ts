/** @fileoverview История атомарных единичных и массовых операций с проверкой конфликтов. */
import { useRef, useState } from 'react';
import type { TableCellEdit } from '@shared/table-cell-edit';
import type { TableEditorProps } from '../editor-types';
/**
 * Хранит только успешно сохранённые операции текущей таблицы.
 * @param save - Условное сохранение всего диапазона одной транзакцией.
 * @returns Сохранение, отмена, повтор и состояние запроса.
 */
export function useTableHistory(save: TableEditorProps['onUpdateCells']) {
  const past = useRef<TableCellEdit[][]>([]);
  const future = useRef<TableCellEdit[][]>([]);
  const lock = useRef(false);
  const [version, setVersion] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  /** Выполняет запрос без наложения на незавершённую операцию. */
  async function run(action: () => Promise<void>) {
    if (lock.current) throw new Error('Дождитесь сохранения предыдущего изменения');
    lock.current = true; setPending(true); setError('');
    try { await action(); setVersion((value) => value + 1); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось сохранить изменение'); throw cause; }
    finally { lock.current = false; setPending(false); }
  }
  /** Записывает диапазон в историю только после подтверждённого сохранения. */
  async function commitBatch(edits: TableCellEdit[]) {
    const changes = edits.filter((edit) => edit.before !== edit.after);
    if (!changes.length) return;
    await run(async () => { await save(changes); past.current.push(changes.map((edit) => ({ ...edit }))); future.current = []; });
  }
  /** Сохраняет одну ячейку как отдельную операцию. */
  async function commit(rowId: number, columnId: string, after: string, before = '') { await commitBatch([{ rowId, columnId, before, after }]); }
  /** Отменяет весь последний диапазон с проверкой его актуальности. */
  async function undo() {
    const change = past.current[past.current.length - 1]; if (!change) return;
    await run(async () => { await save(change.map((edit) => ({ ...edit, before: edit.after, after: edit.before }))); past.current.pop(); future.current.push(change); });
  }
  /** Повторяет весь ранее отменённый диапазон. */
  async function redo() {
    const change = future.current[future.current.length - 1]; if (!change) return;
    await run(async () => { await save(change); future.current.pop(); past.current.push(change); });
  }
  return { commit, commitBatch, undo, redo, pending, error, canUndo: past.current.length > 0, canRedo: future.current.length > 0, version };
}
/** Контракт истории для панелей действий. */
export type TableHistory = ReturnType<typeof useTableHistory>;
