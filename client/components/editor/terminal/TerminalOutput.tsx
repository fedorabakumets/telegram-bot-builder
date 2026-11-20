/**
 * @fileoverview Таблица строк логов: время | уровень | данные
 * @module TerminalOutput
 */

import { useEffect, useRef } from 'react';
import { TerminalLogRow } from './TerminalLogRow';
import { LOG_ROW_GRID } from './terminal-output-format';
import { useTerminalOutputScroll } from './use-terminal-output-scroll';

/** Строка вывода терминала */
interface TerminalLine {
  /** Уникальный идентификатор строки */
  id: string;
  /** Текстовое содержимое строки */
  content: string;
  /** Тип потока: стандартный вывод или ошибки */
  type: 'stdout' | 'stderr';
  /** Время добавления строки */
  timestamp?: Date;
}

/** Пропсы компонента вывода терминала */
interface TerminalOutputProps {
  /** Считать новые строки в режиме текущего потока */
  live?: boolean;
  /** Ключ потока для сброса паузы при переключении */
  streamKey?: string;
  /** Показывать дату рядом со временем при просмотре нескольких дней */
  showDate?: boolean;
  /** Подпись пустой таблицы или состояния загрузки */
  emptyMessage?: string;
  /** Массив строк для отображения */
  lines: TerminalLine[];
  /** Ссылка на контейнер прокрутки */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Масштаб шрифта */
  scale: number;
  /** CSS-класс для обычного текста */
  terminalTextClass: string;
  /** CSS-класс для текста ошибок */
  stderrTextClass: string;
  /** CSS-класс для текста-заглушки */
  placeholderTextClass: string;
  /** Поисковый запрос для подсветки совпадений */
  searchQuery?: string;
  /** ID строки с текущим активным совпадением */
  currentMatchLineId?: string;
  /** Нужно ли скроллить к текущему совпадению */
  shouldScrollToMatch?: boolean;
  /** Обработчик клика по строке */
  onLineClick?: (lineId: string) => void;
  /** ID выбранной строки для подсветки */
  selectedLineId?: string;
}

/**
 * Таблица логов с автоскроллом и подсветкой поиска
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalOutput({
  live = false,
  streamKey,
  showDate,
  emptyMessage,
  lines,
  containerRef,
  scale,
  terminalTextClass,
  stderrTextClass,
  placeholderTextClass,
  searchQuery,
  currentMatchLineId,
  shouldScrollToMatch,
  onLineClick,
  selectedLineId,
}: TerminalOutputProps) {
  const { paused, newLines, scrollToBottom, handleScroll } = useTerminalOutputScroll(containerRef, lines, live, streamKey);
  const lineRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!shouldScrollToMatch || !currentMatchLineId) return;
    const el = lineRefs.current.get(currentMatchLineId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentMatchLineId, shouldScrollToMatch]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <div
        className={[
          LOG_ROW_GRID,
          'items-center py-2 border-b border-border/60 bg-muted/20 shrink-0',
          'text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80 select-none',
        ].join(' ')}
      >
        <span>Время</span>
        <span>Уровень</span>
        <span>Данные</span>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto flex-1 min-h-0 w-full"
        style={{ fontSize: `${scale}em` }}
      >
        {lines.length === 0 ? (
          <div className={`flex items-center justify-center h-full italic text-sm ${placeholderTextClass}`}>
            {emptyMessage ?? 'Нет вывода...'}
          </div>
        ) : (
          lines.map((line, i) => (
            <TerminalLogRow
              showDate={showDate}
              key={line.id}
              line={line}
              even={i % 2 === 1}
              selected={selectedLineId === line.id}
              isCurrentMatch={line.id === currentMatchLineId}
              searchQuery={searchQuery}
              textClass={terminalTextClass}
              stderrClass={stderrTextClass}
              onClick={() => onLineClick?.(line.id)}
              rowRef={(el) => {
                if (el) lineRefs.current.set(line.id, el);
                else lineRefs.current.delete(line.id);
              }}
            />
          ))
        )}
      </div>
      {paused && lines.length > 0 && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden="true">↓</span>
          {newLines > 0 ? `Новые строки: ${newLines}` : 'К последним строкам'}
        </button>
      )}
    </div>
  );
}
