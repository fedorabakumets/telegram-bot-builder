/** @fileoverview Редактируемая ячейка с сохранением черновика, повтором запроса и большим редактором. */
import { useId, useState } from 'react';
import { columnSettings, columnDataTypes, validateColumnValue, type TableColumnSettings } from '@shared/table-column-settings';
import { useCellDraft } from '../hooks/use-cell-draft';
import { CellValueInput } from './cell-value-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
/** Направление перехода между редактируемыми ячейками. */
export type NavigateDirection = 'right' | 'left' | 'down' | 'up';
/** Свойства редактируемой ячейки. */
interface SpreadsheetCellProps {
  /** Устойчивый ключ черновика при смене видимых строк. */
  draftKey: string;
  /** Тип и ограничения столбца. */
  settings?: TableColumnSettings;
  /** Сохранённое значение. */
  value: string;
  /** Условное сохранение значения с проверкой исходного текста. */
  onChange: (value: string, expected: string) => Promise<void>;
  /** Активное редактирование. */
  isFocused: boolean;
  /** Переход между ячейками. */
  onNavigate: (direction: NavigateDirection) => void;
  /** Начало редактирования. */
  onFocus: () => void;
  /** Выход из редактирования. */
  onBlurCell: () => void;
}
/**
 * Сохраняет введённый текст при ошибках и не сообщает об успехе до ответа сервера.
 * @param props - Значение и операции ячейки.
 * @returns Ячейка и просторный редактор по запросу.
 */
export function SpreadsheetCell({ value, onChange, isFocused, onFocus, onNavigate, onBlurCell, draftKey, settings }: SpreadsheetCellProps) {
  const [cell, patch] = useCellDraft(draftKey, value);
  const { draft, baseline, pending, saved } = cell;
  const [expanded, setExpanded] = useState(false);
  const errorId = useId();
  const config = settings ?? columnSettings();
  const validation = validateColumnValue(draft, config);
  const error = validation || cell.error;
  const dirty = draft !== baseline;
  /** Обновляет черновик, не очищая ошибку конфликта до ответа сервера. */
  function edit(value: string) { patch({ draft: value, saved: false }); }
  /** Сохраняет черновик; при конфликте оставляет его доступным для сравнения и копирования. */
  async function commit() {
    if (validation) return false;
    if (!dirty || pending) return !pending;
    patch({ pending: true, error: '', saved: false });
    try { await onChange(draft, baseline); patch({ baseline: draft, saved: true }); return true; }
    catch (cause) { patch({ error: cause instanceof Error ? cause.message : 'Сохранение не удалось. Повторите попытку.' }); return false; }
    finally { patch({ pending: false }); }
  }
  /** Отбрасывает только локальный черновик без изменения сервера. */
  function cancel() { if (pending) return; patch({ draft: value, baseline: value, error: '', saved: false }); setExpanded(false); onBlurCell(); }
  const actions = <div className="flex flex-wrap items-center gap-2 py-2">
    <button type="button" disabled={pending || !dirty || !!validation} onClick={() => { void commit(); }} className="tables-control rounded-md border border-border px-3 py-1 text-sm disabled:opacity-40">{pending ? 'Сохранение…' : error ? 'Повторить сохранение' : 'Сохранить'}</button>
    <button type="button" disabled={pending} onClick={cancel} className="tables-control rounded-md px-3 py-1 text-sm">Отмена</button>
    <span role="status" className="text-xs text-muted-foreground">{saved && !dirty ? 'Сохранено' : dirty ? 'Есть изменения' : ''}</span>
  </div>;
  return <div className="table-editable-cell px-3 py-2">
    {isFocused && !expanded ? <>
      <CellValueInput value={draft} settings={config} pending={pending} error={error} errorId={errorId} onChange={edit}
        onKeyDown={async (event) => { if (event.key === 'Escape') { event.preventDefault(); cancel(); } if (event.key === 'Tab') { event.preventDefault(); const direction = event.shiftKey ? 'left' : 'right'; if (await commit()) onNavigate(direction); } }} />
      <p className="pt-1 text-xs text-muted-foreground">{columnDataTypes[config.dataType]}{config.required ? ' · Обязательно' : ''}{config.min !== undefined ? ` · От ${config.min}` : ''}{config.max !== undefined ? ` · До ${config.max}` : ''}{config.dataType === 'text' ? ` · До ${config.maxLength} символов` : ''}</p>
      {actions}
      <button type="button" onClick={() => setExpanded(true)} className="tables-control rounded-md px-2 py-1 text-xs underline">Открыть большой редактор</button>
    </> : <button type="button" aria-label="Редактировать ячейку" title="Редактировать содержимое" onClick={onFocus} className="table-cell-value block w-full truncate rounded-sm text-left text-sm">{config.dataType === 'boolean' && ['true', 'false'].includes(draft) ? draft === 'true' ? 'Да' : 'Нет' : draft || 'Пусто'}{dirty && <span className="ml-2 text-xs text-muted-foreground">Черновик</span>}</button>}
    {error && !expanded && <p id={errorId} role="alert" className="text-xs text-destructive">{error}</p>}
    <Dialog open={expanded} onOpenChange={(open) => { if (!pending) setExpanded(open); }}>
      <DialogContent className="table-cell-dialog max-h-[80vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Редактирование содержимого</DialogTitle><DialogDescription>Изменения отправляются после нажатия «Сохранить».</DialogDescription></DialogHeader>
        <textarea aria-label="Содержимое в большом редакторе" aria-invalid={!!error} aria-describedby={error ? errorId : undefined} autoFocus disabled={pending} value={draft} rows={12} onChange={(event) => edit(event.target.value)} className="w-full rounded-md border border-border bg-transparent p-3 text-sm" />
        {error && <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>}{actions}
      </DialogContent>
    </Dialog>
  </div>;
}
