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
import { TerminalRepeatedErrors } from './TerminalRepeatedErrors';
import { TerminalLogDetail } from './TerminalLogDetail';
import { copyTerminalOutput, saveTerminalOutput } from './terminalUtils';
import { botLogToTerminalLine } from './bot-log-utils';
import { isVisibleTerminalNotice } from './terminal-log-notices';

/** Пропсы компонента просмотра истории запуска */
interface LaunchHistoryViewerProps {
  /** Имя бота, к которому относится запуск. */
  botName?: string;
  /** ID запуска */
  launchId: number;
  /** Дата запуска (для заголовка) */
  startedAt: string | null;
}

/**
 * Статичные логи запуска: context + toolbar + таблица (как Deploy Logs)
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function LaunchHistoryViewer({ launchId, startedAt, botName }: LaunchHistoryViewerProps) {
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
  /** Строки истории без служебного уведомления о необязательном OpenSSL. */
  const lines = useMemo(() => logs.map(botLogToTerminalLine).filter(isVisibleTerminalNotice), [logs]);
  const { filter, setFilter, filterLines, stderrCount } = useTerminalFilter();
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const selectedIndex = lines.findIndex(line => line.id === selectedLineId);
  /** Переключает детали на соседнюю сохранённую строку. */
  const moveDetail = (offset: number) => {
    const neighbor = lines[selectedIndex + offset];
    if (neighbor) setSelectedLineId(neighbor.id);
  };
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
        title="Прошлый запуск"
        startedAt={startedAt}
        botName={botName}
        errorCount={stderrCount(lines)}
        errorsSelected={filter === 'stderr'}
        onShowErrors={() => setFilter('stderr')}
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
      <TerminalRepeatedErrors lines={lines} onOpenLine={setSelectedLineId} />
      {isLoading ? (
        <div className={`flex-1 flex items-center justify-center ${placeholderTextClass} italic`}>
          Загрузка логов...
        </div>
      ) : logs.length === 0 ? (
        <div className={`flex-1 flex items-center justify-center ${placeholderTextClass} italic`}>
          Логи не сохранены
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="min-w-0 flex-1">
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
            onLineClick={setSelectedLineId}
            selectedLineId={selectedLineId ?? undefined}
          />
          </div>
          {selectedIndex >= 0 && <TerminalLogDetail
            line={lines[selectedIndex]}
            lines={lines}
            onSelectLine={setSelectedLineId}
            onClose={() => setSelectedLineId(null)}
            onPrev={() => moveDetail(-1)}
            onNext={() => moveDetail(1)}
            onScrollToLine={() => {
              const row = Array.from(containerRef.current?.querySelectorAll<HTMLElement>('[data-line-id]') ?? [])
                .find(element => element.dataset.lineId === selectedLineId);
              row?.scrollIntoView({ block: 'center' });
            }}
          />}
        </div>
      )}
    </div>
  );
}
