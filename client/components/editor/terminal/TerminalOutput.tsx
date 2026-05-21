/**
 * @fileoverview Вывод терминала с автоскроллом и подсветкой поиска
 *
 * Компонент отображает строки вывода терминала с поддержкой ANSI,
 * автоматически скроллит вниз при новых строках (если пользователь не листал вверх),
 * и показывает кнопку "↓" когда пользователь прокрутил вверх.
 *
 * @module TerminalOutput
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Ansi from 'ansi-to-react';

/** Строка вывода терминала */
interface TerminalLine {
  /** Уникальный идентификатор строки */
  id: string;
  /** Текстовое содержимое строки */
  content: string;
  /** Тип потока: стандартный вывод или ошибки */
  type: 'stdout' | 'stderr';
}

/** Пропсы компонента вывода терминала */
interface TerminalOutputProps {
  /** Массив строк для отображения */
  lines: TerminalLine[];
  /** Ссылка на контейнер прокрутки */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Высота контейнера (опционально) */
  height?: number;
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
  /** Нужно ли скроллить к текущему совпадению (только при навигации ↑/↓) */
  shouldScrollToMatch?: boolean;
}

/**
 * Проверяет, находится ли контейнер в нижней позиции прокрутки
 * @param el - DOM-элемент контейнера
 * @returns true если прокрутка у нижнего края (погрешность 10px)
 */
function checkIsAtBottom(el: HTMLDivElement): boolean {
  return el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
}

/**
 * Разбивает текст по поисковому запросу и оборачивает совпадения в mark
 * @param text - Исходный текст
 * @param query - Поисковый запрос
 * @param isCurrentMatch - Является ли строка текущим совпадением
 * @returns Массив React-элементов с подсветкой
 */
function highlightMatches(text: string, query: string, isCurrentMatch: boolean) {
  if (!query) return <Ansi>{text}</Ansi>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  const markClass = isCurrentMatch
    ? 'bg-yellow-400/60 dark:bg-yellow-500/50 rounded-sm px-0.5'
    : 'bg-yellow-300/40 dark:bg-yellow-500/30 rounded-sm px-0.5';

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className={markClass}>{part}</mark>
    ) : (
      <Ansi key={i}>{part}</Ansi>
    )
  );
}

/**
 * Компонент вывода терминала с автоскроллом и подсветкой поиска
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
}: TerminalOutputProps) {
  /** Флаг видимости кнопки прокрутки вниз */
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  /** Рефы строк для скролла к текущему совпадению */
  const lineRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  /** Прокручивает контейнер в самый низ и скрывает кнопку */
  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowScrollBtn(false);
  }, [containerRef]);

  /** Обработчик события прокрутки — обновляет видимость кнопки */
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setShowScrollBtn(!checkIsAtBottom(el));
  }, [containerRef]);

  // Автоскролл при появлении новых строк (только если были внизу)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (checkIsAtBottom(el)) {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [lines, containerRef]);

  // Скролл к текущему совпадению только при явной навигации (↑/↓)
  useEffect(() => {
    if (!shouldScrollToMatch || !currentMatchLineId) return;
    const el = lineRefs.current.get(currentMatchLineId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatchLineId, shouldScrollToMatch]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto p-4 whitespace-pre-wrap break-all flex flex-col h-full w-full"
        style={{ fontSize: `${scale}em`, lineHeight: `${1.2 * scale}` }}
      >
        {lines.length === 0 ? (
          <div
            className="flex items-center justify-center h-full italic"
            style={{ color: placeholderTextClass }}
          >
            Нет вывода...
          </div>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              ref={(el) => { if (el) lineRefs.current.set(line.id, el); }}
              className={line.type === 'stderr' ? stderrTextClass : terminalTextClass}
              style={{ wordWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
            >
              {searchQuery
                ? highlightMatches(line.content, searchQuery, line.id === currentMatchLineId)
                : <Ansi>{line.content}</Ansi>}
            </div>
          ))
        )}
      </div>

      {showScrollBtn && (
        <button
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
