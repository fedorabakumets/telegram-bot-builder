/**
 * @fileoverview Синхронизация выбранной строки терминала с ?log= в URL
 * @module terminal/use-terminal-log-url
 */

import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { BotLog } from '@shared/schema';
import { getLogIdFromUrl, clearLogFromUrl } from './terminal-log-permalink';
import { botLogToTerminalLine } from './bot-log-utils';
import { useBotLogs } from '@/components/editor/bot/contexts/bot-logs-context';
import type { TerminalLine } from './terminalTypes';

/** Параметры хука */
interface UseTerminalLogUrlParams {
  /** Ключ логов в контексте */
  logKey: string | null;
  /** Все строки терминала (без фильтра) */
  lines: TerminalLine[];
  /** ID выбранной строки */
  selectedLineId: string | null;
  /** Установить выбранную строку */
  setSelectedLineId: (id: string | null) => void;
  /** Контейнер вывода для прокрутки */
  outputContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Открывает строку из ?log=, подгружает из bot_logs при необходимости
 * @param params - Параметры хука
 * @returns Обработчик закрытия панели деталей
 */
export function useTerminalLogUrl({
  logKey,
  lines,
  selectedLineId,
  setSelectedLineId,
  outputContainerRef,
}: UseTerminalLogUrlParams) {
  const { hydrateLogs } = useBotLogs();
  const urlLogId = getLogIdFromUrl();
  const missingInMemory = urlLogId && !lines.some(l => l.id === urlLogId);

  const { data: fetchedLog } = useQuery<BotLog>({
    queryKey: ['/api/bot-logs', urlLogId],
    queryFn: () => apiRequest('GET', `/api/bot-logs/${urlLogId}`),
    enabled: !!urlLogId && !!missingInMemory,
    retry: false,
  });

  useEffect(() => {
    const logId = getLogIdFromUrl();
    if (logId) setSelectedLineId(logId);
  }, [setSelectedLineId]);

  useEffect(() => {
    if (!logKey || !fetchedLog) return;
    hydrateLogs(logKey, [botLogToTerminalLine(fetchedLog)]);
  }, [logKey, fetchedLog, hydrateLogs]);

  useEffect(() => {
    if (!selectedLineId || !lines.some(l => l.id === selectedLineId)) return;
    const frame = requestAnimationFrame(() => {
      const el = outputContainerRef.current?.querySelector(
        `[data-line-id="${selectedLineId}"]`,
      );
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedLineId, lines, outputContainerRef]);

  const closeDetail = useCallback(() => {
    setSelectedLineId(null);
    clearLogFromUrl();
  }, [setSelectedLineId]);

  return { closeDetail };
}
