/**
 * @fileoverview Таблица строк логов: время | уровень | данные
 * @module TerminalOutput
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TerminalLogRow } from './TerminalLogRow';
import { LOG_ROW_GRID } from './terminal-output-format';

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
 * Проверяет, находится ли контейнер у нижнего края
 * @param el - Элемент прокрутки
 * @returns true если внизу
 */
function checkIsAtBottom(el: HTMLDivElement): boolean {
  return el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
}

/**
 * Таблица логов с автоскроллом и подсветкой поиска
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalOutput({
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
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const lineRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowScrollBtn(false);
  }, [containerRef]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setShowScrollBtn(!checkIsAtBottom(el));
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (checkIsAtBottom(el)) el.scrollTo({ top: el.scrollHeight });
  }, [lines, containerRef]);

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
            Нет вывода...
          </div>
        ) : (
          lines.map((line, i) => (
            <TerminalLogRow
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
      {showScrollBtn && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-primary/80 hover:bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all"
          title="Прокрутить вниз"
        >
          ↓
        </button>
      )}
    </div>
  );
}
