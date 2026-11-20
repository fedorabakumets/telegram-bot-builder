/** @fileoverview Сводка повторов ошибок в загруженных строках терминала. */
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { TerminalLine } from './terminalTypes';

/** Данные панели повторов. */
interface TerminalRepeatedErrorsProps {
  /** Загруженные строки текущего запуска или периода. */
  lines: readonly TerminalLine[];
  /** Открывает подробности конкретной исходной строки. */
  onOpenLine: (lineId: string) => void;
}

const timeFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

/**
 * Собирает точные повторы ошибок и ставит наиболее частые первыми.
 * @param lines - Загруженные строки журнала
 * @returns Группы из двух и более ошибок с исходными идентификаторами
 */
function findRepeatedErrors(lines: readonly TerminalLine[]): TerminalLine[][] {
  const groups = new Map<string, TerminalLine[]>();
  for (const line of lines) {
    if (line.type !== 'stderr' || !line.content.trim()) continue;
    const group = groups.get(line.content);
    if (group) group.push(line);
    else groups.set(line.content, [line]);
  }
  return [...groups.values()]
    .filter(group => group.length > 1)
    .sort((left, right) => right.length - left.length);
}

/**
 * Позволяет раскрыть повторы и открыть любой случай в подробностях.
 * @param props - Строки и обработчик открытия
 * @returns Панель при наличии повторяющихся ошибок
 */
export function TerminalRepeatedErrors({ lines, onOpenLine }: TerminalRepeatedErrorsProps) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => findRepeatedErrors(lines), [lines]);
  if (!groups.length) return null;
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <section className="min-w-0 shrink-0 border-b border-border/60 px-4 py-1 text-xs">
      <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}
        className="inline-flex min-h-8 items-center gap-2 rounded px-2 hover:bg-muted">
        <Chevron aria-hidden="true" className="size-3.5" />
        Повторы ошибок · {groups.length}
      </button>
      {open && (
        <ul className="mb-2 max-h-48 space-y-1 overflow-auto">
          {groups.map(group => {
            const latest = group.reduce((last, line) => line.timestamp > last.timestamp ? line : last);
            return (
              <li key={latest.content} className="rounded border border-border/60">
                <details className="px-2 py-1">
                  <summary className="cursor-pointer truncate py-1" title={latest.content}>
                    <span className="mr-2 font-medium text-destructive">{group.length}×</span>
                    <span className="mr-2 tabular-nums text-muted-foreground">{timeFormat.format(latest.timestamp)}</span>
                    {latest.content}
                  </summary>
                  <ul className="my-1 max-h-32 overflow-auto">
                    {group.map((line, index) => (
                      <li key={line.id}>
                        <button type="button" onClick={() => onOpenLine(line.id)}
                          className="w-full rounded px-2 py-1.5 text-left tabular-nums hover:bg-muted">
                          {index + 1}. {timeFormat.format(line.timestamp)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
