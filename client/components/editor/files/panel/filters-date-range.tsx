/**
 * @fileoverview Явные границы периода загрузки с выбором даты и проверкой порядка.
 * Даты передаются как начало и конец локального дня, включая весь выбранный период.
 */
import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Свойства периода загрузки файлов. */
export interface FiltersDateRangeProps {
  /** Начало периода в формате ISO. */
  dateFrom?: string;
  /** Конец периода в формате ISO. */
  dateTo?: string;
  /** Передать изменённые границы периода. */
  onChange: (from?: string, to?: string) => void;
}

/**
 * Представляет сохранённую дату в локальном формате поля календаря.
 * @param iso - Сохранённая дата
 * @returns Дата для поля или пустая строка
 */
function inputDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Преобразует выбранную дату в границу локального дня.
 * @param value - Дата из поля календаря
 * @param end - Использовать конец дня
 * @returns Граница периода в формате ISO либо отсутствие ограничения
 */
function dayBoundary(value: string, end: boolean): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (end) date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

/**
 * Позволяет независимо выбрать начало и конец периода загрузки.
 * @param props - Границы периода и обработчик изменения
 * @returns Поля календаря с сообщением об ошибке
 */
export function FiltersDateRange({ dateFrom, dateTo, onChange }: FiltersDateRangeProps) {
  const id = useId();
  const invalid = Boolean(dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo));
  return (
    <fieldset className="files-filters-dates space-y-2">
      <legend className="text-sm font-medium">Дата загрузки</legend>
      <div className="files-filters-period">
        <div className="files-filters-date-boundary">
          <Label htmlFor={`${id}-from`}>С</Label>
          <Input id={`${id}-from`} type="date" aria-label="Дата загрузки с"
            value={inputDate(dateFrom)} onChange={(e) => onChange(dayBoundary(e.target.value, false), dateTo)}
            aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined}
            data-testid="filters-date-from" />
        </div>
        <div className="files-filters-date-boundary">
          <Label htmlFor={`${id}-to`}>По</Label>
          <Input id={`${id}-to`} type="date" aria-label="Дата загрузки по"
            value={inputDate(dateTo)} onChange={(e) => onChange(dateFrom, dayBoundary(e.target.value, true))}
            aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined}
            data-testid="filters-date-to" />
        </div>
      </div>
      {invalid && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">Дата «По» должна быть не раньше даты «С».</p>}
    </fieldset>
  );
}
