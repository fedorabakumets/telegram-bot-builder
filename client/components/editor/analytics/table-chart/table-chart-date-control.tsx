/** @fileoverview Явный выбор столбца даты для применения общего периода к таблице. */
import type { ServerColumn } from '@/components/editor/tables/api/server-models';
import { getColumnTitle } from '@/components/editor/tables/utils/display-labels';
/** Связывает строки с периодом. @param props - Колонки, выбор и готовность диапазона. @returns Поле явного выбора столбца даты. */
export function TableChartDateControl({ columns, value, onChange, enabled }: {
  /** Столбцы таблицы. */ columns: ServerColumn[]; /** Выбранная дата. */ value: number | null;
  /** Выбор столбца. */ onChange: (value: number | null) => void; /** Загружен общий диапазон. */ enabled: boolean;
}) {
  return <div className="space-y-2"><label className="analytics-control-field text-sm"><span>Ограничить общим периодом</span><select className="analytics-native-field" value={value ?? ''} disabled={!enabled} onChange={event => onChange(event.target.value ? Number(event.target.value) : null)}><option value="">Текущие данные · все строки</option>{columns.map(column => <option key={column.id} value={column.id}>Дата: {getColumnTitle(column)}</option>)}</select></label>
    <p className="text-xs text-muted-foreground">{value ? 'Используется общий период. Строки без корректной даты не попадают в график.' : 'Период не применяется. Выберите столбец с датами, чтобы отфильтровать строки.'}</p></div>;
}
