/** @fileoverview Селектор языков Telegram с названиями и количествами людей как в фильтре источников. */
import { Languages } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDirectoryControls } from '../../content/user-directory-controls';
/**
 * Подписывает язык на русском, сохраняя код для неизвестных локалей.
 * @param code - Код языка Telegram или отсутствие данных.
 * @returns Читаемая подпись.
 */
export function languageLabel(code: string): string {
  if (code === '__unknown__') return 'Язык не указан';
  try {
    const name = new Intl.DisplayNames(['ru'], { type: 'language' }).of(code) || code;
    return `${name[0].toUpperCase()}${name.slice(1)} (${code})`;
  } catch { return code; }
}
/**
 * Показывает реальные языки текущей аудитории и количество без собственного ограничения.
 * @param props - Выбранное значение черновика и обработчик.
 * @returns Селектор того же вида, что источник и Premium.
 */
export function LanguageFilter({ value, onChange }: {
  /** Текущий код языка. */ value?: string;
  /** Установка языка или снятие ограничения. */ onChange: (value: string | undefined) => void;
}) {
  const counts = useDirectoryControls()?.result?.languageCounts;
  const total = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : undefined;
  const codes = [...new Set([...Object.keys(counts ?? {}), ...(value ? [value] : [])])]
    .sort((a, b) => languageLabel(a).localeCompare(languageLabel(b), 'ru'));
  /** Отсутствие загруженного итога отличается от подтверждённого нуля. */
  const label = (name: string, count?: number) => `${name} · ${count === undefined ? '—' : count.toLocaleString('ru-RU')}`;
  return <Select value={value || 'all'} onValueChange={next => onChange(next === 'all' ? undefined : next)}>
    <SelectTrigger aria-label="Язык Telegram" className="h-10 w-full min-w-0 rounded-lg border-border bg-background text-sm [&>span]:truncate">
      <div className="flex min-w-0 items-center gap-2 [&>span]:truncate">
        <Languages className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /><SelectValue />
      </div>
    </SelectTrigger><SelectContent className="users-portal">
      <SelectItem value="all">{label('Все языки', total)}</SelectItem>
      {codes.map(code => <SelectItem key={code} value={code}>{label(languageLabel(code), counts ? counts[code] ?? 0 : undefined)}</SelectItem>)}
    </SelectContent>
  </Select>;
}
