/** @fileoverview Компактные кнопки истории и состояние сохранения над сеткой. */
import { Undo2, Redo2 } from 'lucide-react';
import type { TableHistory } from '../hooks/use-table-history';
/**
 * Показывает историю без отдельной высокой строки действий.
 * @param props - История текущей таблицы.
 * @returns Кнопки отмены, повтора и состояние запроса.
 */
export function TableHistoryToolbar({ history }: { /** История текущей таблицы. */ history: TableHistory }) {
  return <div className="flex min-w-0 flex-wrap items-center gap-2">
    <button type="button" aria-label="Отменить" title="Отменить изменение" disabled={history.pending || !history.canUndo} onClick={() => { void history.undo().catch(() => {}); }} className="tables-control rounded-md border border-border p-2 disabled:opacity-40"><Undo2 className="h-4 w-4" /></button>
    <button type="button" aria-label="Повторить" title="Повторить изменение" disabled={history.pending || !history.canRedo} onClick={() => { void history.redo().catch(() => {}); }} className="tables-control rounded-md border border-border p-2 disabled:opacity-40"><Redo2 className="h-4 w-4" /></button>
    <span role="status" className="text-xs text-muted-foreground">{history.pending ? 'Сохранение…' : history.version > 0 && !history.error ? 'Сохранено' : ''}</span>
    {history.error && <span role="alert" className="text-xs text-destructive">{history.error}</span>}
  </div>;
}
