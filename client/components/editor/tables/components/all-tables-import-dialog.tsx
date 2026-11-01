/** @fileoverview Общий импорт с предпросмотром и атомарным сохранением всего файла. */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { parseAllTablesExport, type ImportedTable } from '../utils/import-all-tables';
import { validateImportPreview } from '../utils/import-preview';
import { tableKeys } from '../hooks/use-tables-query';
/** Свойства общего импорта. */
interface AllTablesImportDialogProps {
  /** Проект назначения. */
  projectId: number;
  /** Закрытие формы. */
  onClose: () => void;
}
/**
 * Не закрывает предпросмотр при ошибке и не оставляет часть импортированных таблиц.
 * @param props - Проект и закрытие формы.
 * @returns Диалог импорта общего JSON.
 */
export function AllTablesImportDialog({ projectId, onClose }: AllTablesImportDialogProps) {
  const [tables, setTables] = useState<ImportedTable[]>([]);
  const [error, setError] = useState(''), [pending, setPending] = useState(false);
  const queryClient = useQueryClient();
  const ready = tables.filter((table) => table.name !== '_content');
  const errors = ready.flatMap((table) => validateImportPreview(table.columns, table.rows, table.columnSettings?.map((settings, index) => ({ id: String(index), name: table.columns[index], settings })), 'bundle').map((message) => `${table.name}: ${message}`));
  if (ready.length > 50) errors.push('За одну операцию можно импортировать до 50 таблиц');
  /** Проверяет весь файл до появления доступной кнопки подтверждения. */
  async function read(file: File) {
    setError(''); setTables([]);
    try { setTables(parseAllTablesExport(await file.text()).tables); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось прочитать файл'); }
  }
  /** Импортирует все пользовательские таблицы одной транзакцией на сервере. */
  async function apply() {
    setPending(true); setError('');
    try { await apiRequest('POST', `/api/projects/${projectId}/tables/import`, { mode: 'create', tables: ready }); await queryClient.invalidateQueries({ queryKey: tableKeys.tables(projectId) }); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Импорт не выполнен'); }
    finally { setPending(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}><DialogContent className="table-cell-dialog max-h-[85vh] overflow-auto sm:max-w-2xl">
    <DialogHeader><DialogTitle>Импорт таблиц проекта</DialogTitle><DialogDescription>Будут созданы новые таблицы. Существующие данные сохранятся.</DialogDescription></DialogHeader>
    <input type="file" aria-label="Файл всех таблиц" accept=".json" disabled={pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void read(file); }} />
    {tables.some((table) => table.name === '_content') && <p className="text-sm text-muted-foreground">Контент формируется из сценария и отдельно не импортируется.</p>}
    {ready.map((table, index) => <details key={index} className="rounded-md border border-border p-3"><summary className="cursor-pointer text-sm">{table.name} · {table.columns.length} столбцов · {table.rows.length} строк</summary><div className="max-h-40 overflow-auto pt-3"><table className="w-full text-left text-xs"><thead><tr>{table.columns.map((name, ci) => <th key={ci} className="p-2">{name}</th>)}</tr></thead><tbody>{table.rows.slice(0, 5).map((row, ri) => <tr key={ri}>{row.map((value, ci) => <td key={ci} className="max-w-64 truncate p-2">{value}</td>)}</tr>)}</tbody></table></div></details>)}
    {errors.slice(0, 20).map((message, index) => <p key={index} role="alert" className="text-sm text-destructive">{message}</p>)}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={pending} onClick={onClose} className="tables-control rounded-md px-3 py-2 text-sm">Отмена</button><button type="button" disabled={pending || !ready.length || !!errors.length} onClick={() => { void apply(); }} className="tables-control rounded-md border border-border px-3 py-2 text-sm disabled:opacity-40">{pending ? 'Импорт…' : 'Импортировать таблицы'}</button></div>
  </DialogContent></Dialog>;
}
