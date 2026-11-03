/** @fileoverview Редактируемая ячейка с сохранением черновика, повтором запроса прямо в таблице. */
import { useId } from 'react';
import { Check, X } from 'lucide-react';
import '../table-cell-editor.css';
import { columnSettings, validateColumnValue, type TableColumnSettings } from '@shared/table-column-settings';
import { useCellDraft } from '../hooks/use-cell-draft';
import { CellValueInput } from './cell-value-input';
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
 * @returns Ячейка с встроенным редактированием и действиями сохранения.
 */
export function SpreadsheetCell({ value, onChange, isFocused, onFocus, onNavigate, onBlurCell, draftKey, settings }: SpreadsheetCellProps) {
  const [cell, patch] = useCellDraft(draftKey, value);
  const { draft, baseline, pending, saved } = cell;
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
  function cancel() { if (pending) return; patch({ draft: value, baseline: value, error: '', saved: false }); onBlurCell(); }
  /** Компактные действия не увеличивают строку до отдельной формы. */
  const actions = <div className="table-cell-actions flex items-center justify-end gap-1">
    <button type="button" aria-label={pending ? 'Сохранение' : error ? 'Повторить сохранение' : 'Сохранить'} title="Сохранить" disabled={pending || !dirty || !!validation} onClick={() => { void commit(); }} className="tables-control rounded p-1 disabled:opacity-40"><Check className="h-4 w-4" /></button>
    <button type="button" aria-label="Отмена" title="Отменить изменения · Esc" disabled={pending} onClick={cancel} className="tables-control rounded p-1"><X className="h-4 w-4" /></button>
    <span role="status" className="sr-only">{pending ? 'Сохранение' : saved && !dirty ? 'Сохранено' : dirty ? 'Есть изменения' : ''}</span>
  </div>;
  return <div data-editing={isFocused} className="table-editable-cell px-3 py-2">
    {isFocused ? <>
      <CellValueInput value={draft} settings={config} pending={pending} error={error} errorId={errorId} onChange={edit}
        onKeyDown={async (event) => { if (event.key === 'Escape') { event.preventDefault(); cancel(); } if (event.key === 'Tab') { event.preventDefault(); const direction = event.shiftKey ? 'left' : 'right'; if (await commit()) onNavigate(direction); } }} />
      {actions}
    </> : <button type="button" aria-label="Редактировать ячейку" title="Редактировать содержимое" onClick={onFocus} className="table-cell-value block w-full truncate rounded-sm text-left text-sm">{config.dataType === 'boolean' && ['true', 'false'].includes(draft) ? draft === 'true' ? 'Да' : 'Нет' : draft}{dirty && <span className="ml-2 text-xs text-muted-foreground">Черновик</span>}</button>}
    {error && <p id={errorId} role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}
