/** @fileoverview Импорт CSV и JSON с проверкой файла и явным подтверждением добавления. */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { parseCsv } from '../utils/parse-csv';
import { parseJsonTable } from '../utils/parse-json';
import { validateImportPreview } from '../utils/import-preview';
import { TableImportPreview } from './table-import-preview';
import type { TableColumn } from '../types';
/** Свойства диалога импорта. */
interface ImportDialogProps {
  /** Видимость формы. */
  open: boolean;
  /** Закрытие формы. */
  onClose: () => void;
  /** Создание новой таблицы с данными. */
  onImportNew: (name: string, columns: string[], rows: string[][]) => Promise<void>;
  /** Добавление строк в текущую таблицу. */
  onImportRows: (rows: string[][]) => Promise<void>;
  /** Возможность добавления в текущую таблицу. */
  hasSelectedTable: boolean;
  /** Реальные столбцы назначения. */
  targetColumns: TableColumn[];
}
/**
 * Сохраняет файл и ошибки в форме до успешного завершения запроса.
 * @param props - Назначение и операции импорта.
 * @returns Диалог с предпросмотром.
 */
export function ImportDialog({ open, onClose, onImportNew, onImportRows, hasSelectedTable, targetColumns }: ImportDialogProps) {
  const [mode, setMode] = useState('new'), [name, setName] = useState('');
  const [columns, setColumns] = useState<string[]>([]), [rows, setRows] = useState<string[][]>([]);
  const [error, setError] = useState(''), [pending, setPending] = useState(false);
  const target = mode === 'append' ? targetColumns : undefined;
  const errors = rows.length ? validateImportPreview(columns, rows, target) : [];
  /** Читает выбранный файл для проверки без отправки данных. */
  async function read(file: File) {
    setError(''); setRows([]); setColumns([]);
    try {
      const text = await file.text();
      if (!/\.(csv|json)$/i.test(file.name)) throw new Error('Выберите файл CSV или JSON');
      const data = /\.csv$/i.test(file.name) ? parseCsv(text) : parseJsonTable(text);
      setColumns(data.columns); setRows(data.rows); setName(file.name.replace(/\.(csv|json)$/i, ''));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось прочитать файл'); }
  }
  /** Сохраняет подтверждённый импорт, оставляя предпросмотр при ошибке запроса. */
  async function apply() {
    setPending(true); setError('');
    try { if (mode === 'new') await onImportNew(name.trim(), columns, rows); else await onImportRows(rows); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Импорт не выполнен'); }
    finally { setPending(false); }
  }
  const control = 'w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm';
  return <Dialog open={open} onOpenChange={(value) => { if (!value && !pending) onClose(); }}><DialogContent className="table-cell-dialog max-h-[85vh] overflow-auto sm:max-w-3xl">
    <DialogHeader><DialogTitle>Импорт данных</DialogTitle><DialogDescription>Проверьте столбцы и строки перед добавлением.</DialogDescription></DialogHeader>
    <input type="file" aria-label="Файл импорта" accept=".csv,.json" disabled={pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void read(file); }} />
    <label className="text-sm">Назначение<select aria-label="Назначение импорта" value={mode} onChange={(event) => setMode(event.target.value)} disabled={pending} className={control}><option value="new">Новая таблица</option>{hasSelectedTable && <option value="append">Добавить строки в текущую таблицу</option>}</select></label>
    {mode === 'new' && <label className="text-sm">Название новой таблицы<input aria-label="Название импортируемой таблицы" value={name} onChange={(event) => setName(event.target.value)} className={control} disabled={pending} /></label>}
    {!!rows.length && <TableImportPreview columns={columns} rows={rows} target={target} />}
    {errors.slice(0, 20).map((message, index) => <p key={index} role="alert" className="text-sm text-destructive">{message}</p>)}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={onClose} disabled={pending} className="tables-control rounded-md px-3 py-2 text-sm">Отмена</button><button type="button" onClick={() => { void apply(); }} disabled={pending || !rows.length || errors.length > 0 || (mode === 'new' && !name.trim())} className="tables-control rounded-md border border-border px-3 py-2 text-sm disabled:opacity-40">{pending ? 'Импорт…' : 'Подтвердить импорт'}</button></div>
  </DialogContent></Dialog>;
}
