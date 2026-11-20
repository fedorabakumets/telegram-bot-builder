/** @fileoverview Соседние загруженные записи в деталях строки терминала. */
import type { TerminalLine } from './terminalTypes';

/** Параметры списка соседних записей. */
interface TerminalLogContextProps {
  /** Загруженные строки в порядке вывода без фильтра по уровню. */
  lines: readonly TerminalLine[];
  /** Идентификатор открытой записи. */
  selectedId: string;
  /** Открывает детали соседней записи. */
  onSelectLine: (id: string) => void;
}

/**
 * Показывает до двух записей перед открытой строкой и до двух после неё.
 * @param props - Строки, выбранная запись и обработчик перехода
 * @returns Список соседних записей или пустое состояние
 */
export function TerminalLogContext({ lines, selectedId, onSelectLine }: TerminalLogContextProps) {
  const index = lines.findIndex(line => line.id === selectedId);
  const preceding = index < 0 ? [] : lines.slice(Math.max(0, index - 2), index);
  const following = index < 0 ? [] : lines.slice(index + 1, index + 3);

  return (
    <section className="mt-4 space-y-2 border-t border-border pt-3">
      <h3 className="text-xs font-medium text-muted-foreground">Соседние строки</h3>
      {preceding.length + following.length === 0 && (
        <p className="text-xs text-muted-foreground">Соседних строк среди загруженных логов нет.</p>
      )}
      {[preceding, following].map((group, groupIndex) => group.length > 0 && (
        <div key={groupIndex} className="space-y-1">
          <p className="text-xs text-muted-foreground">{groupIndex === 0 ? 'До этой строки' : 'После этой строки'}</p>
          {group.map(line => (
            <button
              key={line.id}
              type="button"
              className="flex w-full min-w-0 items-start gap-2 rounded border border-border p-2 text-left text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onSelectLine(line.id)}
            >
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {line.timestamp?.toLocaleTimeString('ru-RU') ?? '—'}
              </span>
              <span className={`line-clamp-2 min-w-0 break-all font-mono ${line.type === 'stderr' ? 'text-destructive' : 'text-foreground'}`}>
                {line.content}
              </span>
            </button>
          ))}
        </div>
      ))}
    </section>
  );
}
