/** @fileoverview Форма подписи, типа и ограничений столбца с сохранением внутреннего имени. */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { columnSettings, columnDataTypes, tableColumnSettingsSchema, type TableColumnSettings } from '@shared/table-column-settings';
import { tableKeys } from '../hooks/use-tables-query';
import type { TableColumn } from '../types';
/** Свойства формы настроек. */
interface ColumnSettingsDialogProps {
  /** Проект столбца. */
  projectId: number;
  /** Таблица столбца. */
  tableId: string;
  /** Изменяемый столбец. */
  column: TableColumn;
  /** Закрытие формы. */
  onClose: () => void;
}
/**
 * Сохраняет подпись и правила, не переименовывая столбец в сценариях бота.
 * @param props - Контекст столбца и закрытие формы.
 * @returns Диалог настроек с проверкой значений.
 */
export function ColumnSettingsDialog({ projectId, tableId, column, onClose }: ColumnSettingsDialogProps) {
  const [settings, setSettings] = useState(() => columnSettings(column.settings));
  const [error, setError] = useState(''), [pending, setPending] = useState(false);
  const queryClient = useQueryClient();
  /** Сохраняет проверенные настройки и обновляет описание столбцов. */
  async function save() {
    const parsed = tableColumnSettingsSchema.safeParse(settings);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Проверьте ограничения'); return; }
    setPending(true); setError('');
    try { await apiRequest('PUT', `/api/projects/${projectId}/tables/${tableId}/columns/${column.id}/settings`, parsed.data); await queryClient.invalidateQueries({ queryKey: tableKeys.columns(projectId, Number(tableId)) }); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось сохранить настройки'); }
    finally { setPending(false); }
  }
  /** Изменяет числовую границу, позволяя полностью убрать ограничение. */
  function limit(key: 'min' | 'max', value: string) { setSettings((previous) => ({ ...previous, [key]: value === '' ? undefined : Number(value) })); }
  const control = 'mt-2 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm';
  return <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}><DialogContent className="table-cell-dialog max-h-[85vh] overflow-auto sm:max-w-lg">
    <DialogHeader><DialogTitle>Настройки столбца</DialogTitle><DialogDescription>Подпись видна в таблице. Внутреннее имя продолжает использоваться ботом.</DialogDescription></DialogHeader>
    <p className="text-sm text-muted-foreground">Внутреннее имя: <code>{column.name}</code></p>
    <label className="text-sm">Подпись<input aria-label="Подпись столбца" value={settings.displayName} disabled={pending} placeholder={column.name} onChange={(event) => setSettings({ ...settings, displayName: event.target.value })} className={control} /></label>
    <label className="text-sm">Тип данных<select aria-label="Тип данных столбца" value={settings.dataType} disabled={pending} onChange={(event) => setSettings({ ...settings, dataType: event.target.value as TableColumnSettings['dataType'] })} className={control}>
      {Object.entries(columnDataTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.required} disabled={pending} onChange={(event) => setSettings({ ...settings, required: event.target.checked })} />Обязательно заполнять</label>
    {settings.dataType === 'number' && <div className="grid grid-cols-2 gap-3"><label className="text-sm">Минимум<input aria-label="Минимальное число" type="number" value={settings.min ?? ''} disabled={pending} onChange={(event) => limit('min', event.target.value)} className={control} /></label><label className="text-sm">Максимум<input aria-label="Максимальное число" type="number" value={settings.max ?? ''} disabled={pending} onChange={(event) => limit('max', event.target.value)} className={control} /></label></div>}
    {settings.dataType === 'text' && <label className="text-sm">Максимум символов<input aria-label="Максимальная длина текста" type="number" min={1} max={10000} value={settings.maxLength} disabled={pending} onChange={(event) => setSettings({ ...settings, maxLength: Number(event.target.value) })} className={control} /></label>}
    <p className="text-xs text-muted-foreground">Существующие значения сохранятся. Ячейки, нарушающие новые правила, будут отмечены ошибкой.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={pending} onClick={onClose} className="tables-control rounded-md px-3 py-2 text-sm">Отмена</button><button type="button" disabled={pending} onClick={() => { void save(); }} className="tables-control rounded-md border border-border px-3 py-2 text-sm">{pending ? 'Сохранение…' : 'Сохранить настройки'}</button></div>
  </DialogContent></Dialog>;
}
