/** @fileoverview Общий экспорт и импорт пользовательских таблиц с отображением ошибок запроса. */
import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportAllTables } from '../utils/export-all-tables';
import { AllTablesImportDialog } from './all-tables-import-dialog';
/** Свойства действий проекта. */
interface AllTablesActionsProps {
  /** Проект таблиц. */
  projectId: number;
}
/**
 * Показывает экспорт и открывает проверенный импорт всех таблиц.
 * @param props - Проект пользователя.
 * @returns Кнопки с состояниями запроса.
 */
export function AllTablesActions({ projectId }: AllTablesActionsProps) {
  const [open, setOpen] = useState(false), [pending, setPending] = useState(false), [error, setError] = useState('');
  /** Выгружает таблицы, сохраняя сообщение при сетевом отказе. */
  async function download() {
    setPending(true); setError('');
    try { await exportAllTables(projectId); }
    catch { setError('Не удалось выгрузить таблицы. Повторите попытку.'); }
    finally { setPending(false); }
  }
  return <>
    <div className="flex items-center gap-1">
      <button type="button" title="Экспорт всех таблиц" aria-label="Экспорт всех таблиц" disabled={pending} className="tables-control flex items-center gap-2 disabled:opacity-40" onClick={() => { void download(); }}><Download className="h-4 w-4" /><span>{pending ? 'Экспорт…' : 'Экспорт всех'}</span></button>
      <button type="button" title="Импорт таблиц из файла" aria-label="Импорт таблиц из файла" className="tables-control flex items-center gap-2" onClick={() => setOpen(true)}><Upload className="h-4 w-4" /><span>Импорт всех</span></button>
    </div>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {open && <AllTablesImportDialog projectId={projectId} onClose={() => setOpen(false)} />}
  </>;
}
