/**
 * @fileoverview Хук для управления строками терминала
 *
 * Предоставляет состояние строк и автопрокрутку.
 *
 * @module useTerminalLines
 */

import { useState, useEffect, useRef } from 'react';
import { useBotLogs } from '@/components/editor/bot/bot-logs-context';
import { TerminalLine } from './terminalTypes';

interface UseTerminalLinesResult {
  lines: TerminalLine[];
  outputContainerRef: React.RefObject<HTMLDivElement>;
  setLines: (lines: TerminalLine[] | ((prev: TerminalLine[]) => TerminalLine[])) => void;
}

/**
 * Хук для управления строками терминала
 * @param logKey - Ключ для доступа к логам
 * @returns Объект со строками и ссылкой на контейнер
 */
export function useTerminalLines(logKey: string | null): UseTerminalLinesResult {
  const { getLogs } = useBotLogs();
  const outputContainerRef = useRef<HTMLDivElement>(null);

  // Получаем логи из контекста при монтировании
  const storedLines = logKey ? getLogs(logKey) : [];
  const [lines, setLines] = useState<TerminalLine[]>(storedLines);

  // Синхронизируем состояние при изменении storedLines
  useEffect(() => {
    if (logKey) {
      setLines(getLogs(logKey));
    }
  }, [logKey, getLogs]);

  // Эффект для автопрокрутки к последней строке
  useEffect(() => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [lines]);

  return {
    lines,
    outputContainerRef,
    setLines
  };
}
