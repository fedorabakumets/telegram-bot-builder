/** @fileoverview Управление прокруткой и счётчиком новых строк терминала. */
import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** Возвращает признак нахождения у нижнего края с допуском для дробных пикселей. */
function isAtBottom(element: HTMLDivElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= 10;
}

/**
 * Следит за потоком, пока пользователь находится внизу таблицы.
 * @param containerRef - Ссылка на область прокрутки
 * @param lines - Отображаемые строки
 * @param live - Режим текущего потока
 * @param streamKey - Ключ выбранного потока
 * @returns Состояние паузы и обработчики прокрутки
 */
export function useTerminalOutputScroll(
  containerRef: RefObject<HTMLDivElement>,
  lines: readonly { id: string }[],
  live: boolean,
  streamKey?: string,
) {
  const following = useRef(true);
  const previous = useRef({ lines, live, streamKey });
  const [paused, setPaused] = useState(false);
  const [newLines, setNewLines] = useState(0);

  /** Возобновляет слежение и сразу показывает конец потока. */
  const scrollToBottom = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;
    following.current = true;
    element.scrollTop = element.scrollHeight;
    setPaused(false);
    setNewLines(0);
  }, [containerRef]);

  /** Запоминает положение до следующего добавления строк. */
  const handleScroll = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;
    following.current = isAtBottom(element);
    setPaused(!following.current);
    if (following.current) setNewLines(0);
  }, [containerRef]);

  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { lines, live, streamKey };

    if (before.streamKey !== streamKey || before.live !== live || !lines.length) {
      scrollToBottom();
      return;
    }

    if (following.current) {
      scrollToBottom();
      return;
    }

    if (!live) return;
    /** Поиск последней прежней строки учитывает вытеснение начала буфера. */
    const lastId = before.lines[before.lines.length - 1]?.id;
    const lastIndex = lines.findIndex(line => line.id === lastId);
    if (lastIndex < 0) return;
    const added = lines.length - lastIndex - 1;
    if (added > 0) setNewLines(count => count + added);
  }, [lines, live, scrollToBottom, streamKey]);

  return { paused, newLines, scrollToBottom, handleScroll };
}
