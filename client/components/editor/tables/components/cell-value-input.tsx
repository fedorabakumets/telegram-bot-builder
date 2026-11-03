/** @fileoverview Поля ввода ячейки с учётом типа значения столбца. */
import type { KeyboardEvent } from 'react';
import type { TableColumnSettings } from '@shared/table-column-settings';
/** Свойства поля ячейки. */
interface CellValueInputProps {
  /** Текущее введённое значение. */
  value: string;
  /** Тип и ограничения значения. */
  settings: TableColumnSettings;
  /** Сохранение выполняется. */
  pending: boolean;
  /** Ошибка для доступной подписи поля. */
  error: string;
  /** Идентификатор сообщения ошибки. */
  errorId: string;
  /** Ввод нового значения. */
  onChange: (value: string) => void;
  /** Навигация по клавиатуре. */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}
/**
 * Показывает текст, дату или переключатель без преобразования хранимого значения.
 * @param props - Тип столбца и состояние редактирования.
 * @returns Доступное поле соответствующего типа.
 */
export function CellValueInput({ value, settings, pending, error, errorId, onChange, onKeyDown }: CellValueInputProps) {
  const common = { autoFocus: true, 'aria-label': 'Содержимое ячейки', 'aria-invalid': Boolean(error), 'aria-describedby': error ? errorId : undefined, disabled: pending, value, onKeyDown, className: 'w-full rounded-md border border-border bg-transparent p-2 text-sm' };
  if (settings.dataType === 'boolean') return <select {...common} onChange={(event) => onChange(event.target.value)}><option value="">Не задано</option><option value="true">Да</option><option value="false">Нет</option></select>;
  if (settings.dataType === 'date') return <input {...common} type="date" onChange={(event) => onChange(event.target.value)} />;
  if (settings.dataType === 'number' || settings.dataType === 'link') return <input {...common} type="text" inputMode={settings.dataType === 'number' ? 'decimal' : 'url'} onChange={(event) => onChange(event.target.value)} />;
  return <textarea {...common} rows={Math.min(6, Math.max(1, value.split('\n').length))} onChange={(event) => onChange(event.target.value)} />;
}
