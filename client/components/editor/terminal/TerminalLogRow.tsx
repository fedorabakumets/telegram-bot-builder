/**
 * @fileoverview Одна строка таблицы логов (время · уровень · данные)
 * @module terminal/TerminalLogRow
 */

import Ansi from 'ansi-to-react';
import {
  formatLogTime,
  formatLogTimeTitle,
  stripLeadingTimestamp,
  highlightLogMatches,
  LOG_ROW_GRID,
} from './terminal-output-format';

/** Строка лога */
export interface TerminalLogRowLine {
  /** ID */
  id: string;
  /** Текст */
  content: string;
  /** Поток */
  type: 'stdout' | 'stderr';
  /** Время */
  timestamp?: Date;
}

/** Пропсы строки */
interface TerminalLogRowProps {
  /** Данные строки */
  line: TerminalLogRowLine;
  /** Чётная строка (зебра) */
  even: boolean;
  /** Выбрана */
  selected: boolean;
  /** Текущее совпадение поиска */
  isCurrentMatch: boolean;
  /** Поисковый запрос */
  searchQuery?: string;
  /** Класс текста stdout */
  textClass: string;
  /** Класс текста stderr */
  stderrClass: string;
  /** Клик */
  onClick: () => void;
  /** Ref для скролла к совпадению */
  rowRef: (el: HTMLDivElement | null) => void;
}

/**
 * Строка лога с ровными колонками и бейджем уровня
 * @param props - Свойства
 * @returns JSX элемент
 */
export function TerminalLogRow({
  line,
  even,
  selected,
  isCurrentMatch,
  searchQuery,
  textClass,
  stderrClass,
  onClick,
  rowRef,
}: TerminalLogRowProps) {
  const isErr = line.type === 'stderr';
  const body = stripLeadingTimestamp(line.content);

  return (
    <div
      ref={rowRef}
      role="button"
      tabIndex={0}
      data-line-id={line.id}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={[
        'grid items-start cursor-pointer border-b border-border/15 py-1.5',
        LOG_ROW_GRID,
        'transition-colors outline-none focus-visible:bg-muted/40',
        even ? 'bg-muted/[0.04]' : '',
        selected ? 'bg-primary/10 ring-1 ring-inset ring-primary/25' : 'hover:bg-muted/20',
      ].join(' ')}
    >
      <time
        className="pt-0.5 font-mono text-[11px] leading-4 tabular-nums text-muted-foreground/70 whitespace-nowrap"
        dateTime={line.timestamp?.toISOString()}
        title={formatLogTimeTitle(line.timestamp)}
      >
        {formatLogTime(line.timestamp)}
      </time>
      <span className="pt-0.5 flex justify-start">
        <span
          className={[
            'inline-flex h-4 min-w-[2.5rem] items-center justify-center rounded px-1',
            'text-[9px] font-semibold uppercase tracking-wide leading-none',
            isErr
              ? 'bg-red-500/12 text-red-500 dark:text-red-400'
              : 'bg-muted/60 text-muted-foreground',
          ].join(' ')}
        >
          {isErr ? 'err' : 'info'}
        </span>
      </span>
      <div
        className={[
          'min-w-0 text-[12px] leading-5 break-words [overflow-wrap:anywhere]',
          isErr ? stderrClass : textClass,
        ].join(' ')}
      >
        {searchQuery
          ? highlightLogMatches(body, searchQuery, isCurrentMatch)
          : <Ansi>{body}</Ansi>}
      </div>
    </div>
  );
}
