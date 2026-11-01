/** @fileoverview Переиспользуемый выбор количества файлов над списком и в нижней навигации. */
import { ChevronDown } from 'lucide-react';

/** Свойства выбора размера страницы. */
interface FilePageSizeProps {
  /** Текущее количество файлов. */
  value: number;
  /** Изменение размера страницы. */
  onChange: (value: number) => void;
}
/**
 * Показывает явно подписанный выбор 5, 10, 25, 50 или 100 файлов.
 * @param props - Значение и обработчик
 * @returns Селектор количества файлов
 */
export function FilePageSize({ value, onChange }: FilePageSizeProps) {
  return <label className="files-page-size flex min-w-0 items-center gap-3 text-sm text-muted-foreground">
    <span className="whitespace-nowrap">Показывать по:</span>
    <span className="relative inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border bg-background px-2 text-foreground focus-within:outline focus-within:outline-2 focus-within:outline-primary">
      <span aria-hidden="true" className="tabular-nums">{value}</span>
      <ChevronDown className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <select aria-label="Файлов на странице" value={value} onChange={event => onChange(Number(event.target.value))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
        {[5, 10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
      </select>
    </span>
  </label>;
}
