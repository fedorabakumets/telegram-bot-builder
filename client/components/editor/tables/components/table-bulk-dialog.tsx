/** @fileoverview Подтверждение массовой замены и вставки диапазона без скрытых изменений. */
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { TableCellEdit } from '@shared/table-cell-edit';
import type { BotTable, TableRow } from '../types';
import { editableColumn, pastePlan, replacementPlan } from '../utils/cell-edit-plan';
import { getColumnLabel } from '../utils/display-labels';
import { TableBulkPreview } from './table-bulk-preview';
/** Свойства диалога операции. */
interface TableBulkDialogProps {
  /** Режим массового редактирования. */
  mode: 'replace' | 'paste';
  /** Текущая таблица. */
  table: BotTable;
  /** Выбранные или отфильтрованные целевые строки. */
  rows: TableRow[];
  /** Начальная строка диапазона. */
  rowId?: number;
  /** Начальный столбец диапазона. */
  columnId?: string;
  /** Текст вставки из события буфера. */
  initialText?: string;
  /** Атомарное сохранение всех изменений. */
  onApply: (edits: TableCellEdit[]) => Promise<void>;
  /** Закрытие без сохранения. */
  onClose: () => void;
}
/**
 * Фиксирует снимок исходных значений и сохраняет только после проверки пользователем.
 * @param props - Режим, таблица и обработчик применения.
 * @returns Диалог с полным планом изменений.
 */
export function TableBulkDialog({ mode, table, rows, rowId, columnId, initialText, onApply, onClose }: TableBulkDialogProps) {
  const [snapshot, setSnapshot] = useState({ table, rows });
  const [find, setFind] = useState(''), [replacement, setReplacement] = useState('');
  const [column, setColumn] = useState(columnId ?? table.columns.find((item) => editableColumn(table, item.id))?.id ?? '');
  const [startRow, setStartRow] = useState(rowId ?? rows[0]?.id ?? 0);
  const [text, setText] = useState(initialText ?? '');
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  const plan = useMemo(() => mode === 'replace' ? replacementPlan(snapshot.table, snapshot.rows, find, replacement, column) : pastePlan(snapshot.table, snapshot.rows, startRow, column, text), [snapshot, mode, find, replacement, column, startRow, text]);
  /** Применяет подтверждённый план; при конфликте сохраняет все исходные тексты. */
  async function apply() {
    setPending(true); setError('');
    try { await onApply(plan.edits); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось сохранить диапазон'); }
    finally { setPending(false); }
  }
  const control = 'w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm';
  return <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}><DialogContent className="table-cell-dialog max-h-[85vh] overflow-auto sm:max-w-4xl">
    <DialogHeader><DialogTitle>{mode === 'replace' ? 'Найти и заменить' : 'Вставить диапазон'}</DialogTitle><DialogDescription>Проверьте изменения перед сохранением. При конфликте данных весь диапазон останется без изменений.</DialogDescription></DialogHeader>
    <label className="space-y-2 text-sm">{mode === 'replace' ? 'Столбец для замены' : 'Начальный столбец'}<select aria-label="Столбец операции" value={column} onChange={(event) => setColumn(event.target.value)} className={control} disabled={pending}>
      {mode === 'replace' && <option value="">Все редактируемые столбцы</option>}
      {snapshot.table.columns.filter((item) => editableColumn(table, item.id)).map((item) => <option key={item.id} value={item.id}>{getColumnLabel(item.name)}</option>)}
    </select></label>
    {mode === 'replace' ? <>
      <label className="space-y-2 text-sm">Найти<input aria-label="Найти текст" value={find} onChange={(event) => setFind(event.target.value)} className={control} disabled={pending} /></label>
      <label className="space-y-2 text-sm">Заменить на<input aria-label="Заменить на" value={replacement} onChange={(event) => setReplacement(event.target.value)} className={control} disabled={pending} /></label>
    </> : <>
      <label className="space-y-2 text-sm">Начальная строка<select aria-label="Начальная строка" value={startRow} onChange={(event) => setStartRow(Number(event.target.value))} className={control} disabled={pending}>{snapshot.rows.map((row) => <option key={row.id} value={row.id}>Строка {row.rowIndex}</option>)}</select></label>
      <label className="space-y-2 text-sm">Диапазон из Excel или Google Таблиц<textarea aria-label="Диапазон из буфера" value={text} onChange={(event) => setText(event.target.value)} rows={5} className={control} disabled={pending} /></label>
    </>}
    <TableBulkPreview plan={plan} table={snapshot.table} />
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-3">
      <button type="button" disabled={pending} onClick={() => { setSnapshot({ table, rows }); setError(''); }} className="tables-control rounded-md border border-border px-3 py-2 text-sm">Обновить предпросмотр</button>
      <button type="button" disabled={pending} onClick={onClose} className="tables-control rounded-md px-3 py-2 text-sm">Отмена</button>
      <button type="button" disabled={pending || !plan.edits.length || !!plan.errors.length} onClick={() => { void apply(); }} className="tables-control rounded-md border border-border px-3 py-2 text-sm disabled:opacity-40">{pending ? 'Сохранение…' : 'Применить изменения'}</button>
    </div>
  </DialogContent></Dialog>;
}
