/**
 * @fileoverview Хук для управления строками терминала
 *
 * Читает строки напрямую из BotLogsContext без промежуточного useState,
 * что устраняет двойное хранение и рассинхронизацию при переключении вкладок.
 *
 * @module useTerminalLines
 */

import { useEffect, useRef } from "react";
import { useBotLogs } from "@/components/editor/bot/contexts/bot-logs-context";
import { TerminalLine } from "./terminalTypes";

/** Результат хука useTerminalLines */
interface UseTerminalLinesResult {
  /** Строки терминала из контекста */
  lines: TerminalLine[];
  /** Ссылка на контейнер вывода для автопрокрутки */
  outputContainerRef: React.RefObject<HTMLDivElement>;
  /**
   * No-op для обратной совместимости — управление строками через контекст
   * @param _lines - Игнорируется
   */
  setLines: (
    _lines: TerminalLine[] | ((_prev: TerminalLine[]) => TerminalLine[])
  ) => void;
}

/**
 * Хук для управления строками терминала
 * @param logKey - Ключ для доступа к логам в контексте
 * @returns Объект со строками, ссылкой на контейнер и no-op setLines
 */
export function useTerminalLines(logKey: string | null): UseTerminalLinesResult {
  const { getLogs } = useBotLogs();
  const outputContainerRef = useRef<HTMLDivElement>(null);

  // Читаем строки напрямую из контекста — без промежуточного useState
  const lines = logKey ? getLogs(logKey) : [];

  // Автопрокрутка к последней строке при изменении логов
  useEffect(() => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop =
        outputContainerRef.current.scrollHeight;
    }
  }, [lines]);

  /**
   * No-op: управление строками осуществляется через контекст
   * clearTerminal вызывает clearLogs из контекста напрямую в useTerminalMethods
   */
  const setLines = (
    _lines: TerminalLine[] | ((_prev: TerminalLine[]) => TerminalLine[])
  ): void => {};

  return {
    lines,
    outputContainerRef,
    setLines,
  };
}
