/**
 * @fileoverview Просмотрщик логов истории запуска в стиле Railway Logs
 * @module bot/terminal/LaunchHistoryViewer
 */

import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useLaunchLogs } from '../bot/hooks/use-launch-logs';
import { useTerminalTheme } from './useTerminalTheme';
import { useActiveTerminals } from '../bot/contexts/ActiveTerminalsContext';
import { useTerminalFilter } from './useTerminalFilter';
import { useTerminalSearch } from './useTerminalSearch';
import { TerminalOutput } from './TerminalOutput';
import { TerminalLogsToolbar } from './TerminalLogsToolbar';
import { TerminalLogsContextBar } from './TerminalLogsContextBar';
import { copyTerminalOutput, saveTerminalOutput } from './terminalUtils';
import { botLogToTerminalLine } from './bot-log-utils';

/** Пропсы компонента просмотра истории запуска */
interface LaunchHistoryViewerProps {
  /** ID запуска */
  launchId: number;
  /** Дата запуска (для заголовка) */
  startedAt: string | null;
}

/**
 * Форматирует дату запуска для заголовка
 * @param startedAt - Строка даты
 * @returns Отформатированная строка
 */
function formatStartedAt(startedAt: string | null): string {
  if (!startedAt) return 'Запуск';
  return new Date(startedAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Статичные логи запуска: context + toolbar + таблица (как Deploy Logs)
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function LaunchHistoryViewer({ launchId, startedAt }: LaunchHistoryViewerProps) {
  const { logs, isLoading } = useLaunchLogs(launchId);
  const {
    terminalBgClass, terminalTextClass, placeholderTextClass, stderrTextClass,
  } = useTerminalTheme();
  const { getTabScale, adjustTabScale, removeTerminalById } = useActiveTerminals();
  const historyTabId = `history_${launchId}`;
  const scale = getTabScale(historyTabId);
  const adjustScale = useCallback(
    (factor: number) => adjustTabScale(historyTabId, factor),
    [historyTabId, adjustTabScale],
  );
  const handleClose = useCallback(() => {
    removeTerminalById(historyTabId);
  }, [historyTabId, removeTerminalById]);

  const containerRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => logs.map(botLogToTerminalLine), [logs]);
  const { filter, setFilter, filterLines, stderrCount } = useTerminalFilter();
  const visibleLines = useMemo(() => filterLines(lines), [filterLines, lines]);
  const {
    searchQuery, matchIndices, currentMatchIndex,
    setSearchQuery, goToNextMatch, goToPrevMatch,
  } = useTerminalSearch(visibleLines);
  const [shouldScrollToMatch, setShouldScrollToMatch] = useState(false);

  useEffect(() => {
    if (!isLoading && logs.length > 0) {
      const el = containerRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight });
    }
  }, [isLoading, logs.length]);

  const currentMatchLineId = matchIndices.length > 0
    ? visibleLines[matchIndices[currentMatchIndex]]?.id
    : undefined;

  return (
    <div className={`h-full flex flex-col font-mono text-sm ${terminalBgClass}`}>
      <TerminalLogsContextBar
        title={formatStartedAt(startedAt)}
        subtitle={`#${launchId}`}
        statusLabel="История"
        statusClassName="bg-muted text-muted-foreground border-border"
      />
      <TerminalLogsToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => { setSearchQuery(q); setShouldScrollToMatch(false); }}
        currentMatch={currentMatchIndex}
        totalMatches={matchIndices.length}
        onNext={() => { goToNextMatch(); setShouldScrollToMatch(true); }}
        onPrev={() => { goToPrevMatch(); setShouldScrollToMatch(true); }}
        filter={filter}
        onFilterChange={setFilter}
        stderrCount={stderrCount(lines)}
        onZoomIn={() => adjustScale(1.1)}
        onZoomOut={() => adjustScale(0.9)}
        onCopy={(format) => copyTerminalOutput(visibleLines, format)}
        onSave={(format) => saveTerminalOutput(visibleLines, format)}
        onClose={handleClose}
      />
      {isLoading ? (
        <div className={`flex-1 flex items-center justify-center ${placeholderTextClass} italic`}>
          Загрузка логов...
        </div>
      ) : logs.length === 0 ? (
        <div className={`flex-1 flex items-center justify-center ${placeholderTextClass} italic`}>
          Логи не сохранены
        </div>
      ) : (
        <div className="flex-1 overflow-hidden min-h-0">
          <TerminalOutput
            lines={visibleLines}
            containerRef={containerRef}
            scale={scale}
            terminalTextClass={terminalTextClass}
            stderrTextClass={stderrTextClass}
            placeholderTextClass={placeholderTextClass}
            searchQuery={searchQuery || undefined}
            currentMatchLineId={currentMatchLineId}
            shouldScrollToMatch={shouldScrollToMatch}
          />
        </div>
      )}
    </div>
  );
}
