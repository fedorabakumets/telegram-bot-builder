/**
 * @fileoverview Компонент терминала для отображения вывода питон-скрипта бота
 *
 * Этот компонент предоставляет интерфейс для отображения вывода (stdout/stderr)
 * запущенного питон-скрипта бота в формате, похожем на терминал VS Code.
 *
 * @module Terminal
 */

import { forwardRef, useImperativeHandle, useCallback, useState, useRef } from 'react';
import { TerminalOutput } from './TerminalOutput';
import { TerminalFilterBar } from './TerminalFilterBar';
import { TerminalSearchBar } from './TerminalSearchBar';
import { TerminalLogDetail } from './TerminalLogDetail';
import { copyTerminalOutput, saveTerminalOutput } from './terminalUtils';
import { TerminalHandle, TerminalProps } from './terminalTypes';
import { useTerminalTheme } from './useTerminalTheme';
import { useTerminalResize } from './useTerminalResize';
import { useTerminalLines } from './useTerminalLines';
import { useTerminalMethods } from './useTerminalMethods';
import { useTerminalFilter } from './useTerminalFilter';
import { useTerminalSearch } from './useTerminalSearch';
import { useActiveTerminals } from '../bot/contexts/ActiveTerminalsContext';

export type { TerminalHandle, TerminalProps };

/**
 * Компонент терминала для отображения вывода питон-скрипта
 * @param props - Свойства компонента
 * @param ref - Ссылка для доступа к методам компонента
 * @returns JSX.Element
 */
export const Terminal = forwardRef<TerminalHandle, TerminalProps>((props, ref) => {
  const {
    isVisible = true,
    onToggleVisibility,
    wsConnection,
    projectId,
    tokenId
  } = props;

  // Ключ для доступа к логам
  const logKey = projectId && tokenId ? `${projectId}-${tokenId}` : null;

  // Хук темы
  const themeClasses = useTerminalTheme();

  // Хук изменения размера (используется для будущего ресайза)
  useTerminalResize({ fullSize: true });

  // Масштаб для этой конкретной вкладки
  const tabId = projectId && tokenId ? `${projectId}_${tokenId}` : null;
  const { getTabScale, adjustTabScale } = useActiveTerminals();
  const scale = tabId ? getTabScale(tabId) : 1;
  const adjustScale = useCallback((factor: number) => {
    if (tabId) adjustTabScale(tabId, factor);
  }, [tabId, adjustTabScale]);

  // Хук строк
  const { lines, outputContainerRef, setLines } = useTerminalLines(logKey);

  // Хук методов
  const { addLine, addLineLocal, sendToServer, clearTerminal } = useTerminalMethods({
    logKey,
    wsConnection,
    projectId,
    tokenId,
    setLines
  });

  // Хук фильтрации строк
  const { filter, setFilter, filterLines, stderrCount } = useTerminalFilter();

  // Предоставляем методы через ref
  useImperativeHandle(ref, () => ({
    addLine,
    addLineLocal,
    sendToServer
  }));

  // Отфильтрованные строки для вывода
  const visibleLines = filterLines(lines);

  // Хук поиска по видимым строкам
  const {
    searchQuery,
    matchIndices,
    currentMatchIndex,
    setSearchQuery,
    goToNextMatch,
    goToPrevMatch,
    clearSearch,
  } = useTerminalSearch(visibleLines);

  /** Флаг: нужно ли скроллить к совпадению (только при навигации ↑/↓) */
  const [shouldScrollToMatch, setShouldScrollToMatch] = useState(false);

  /** ID выбранной строки для панели деталей */
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  /** Реф для скролла к выбранной строке */
  const selectedLineRef = useRef<string | null>(null);
  selectedLineRef.current = selectedLineId;

  /** Навигация к предыдущей строке */
  const handleDetailPrev = useCallback(() => {
    const idx = visibleLines.findIndex(l => l.id === selectedLineRef.current);
    if (idx > 0) setSelectedLineId(visibleLines[idx - 1].id);
  }, [visibleLines]);

  /** Навигация к следующей строке */
  const handleDetailNext = useCallback(() => {
    const idx = visibleLines.findIndex(l => l.id === selectedLineRef.current);
    if (idx >= 0 && idx < visibleLines.length - 1) setSelectedLineId(visibleLines[idx + 1].id);
  }, [visibleLines]);

  /** Скролл к выбранной строке в контексте */
  const handleScrollToLine = useCallback(() => {
    if (!selectedLineRef.current || !outputContainerRef.current) return;
    const el = outputContainerRef.current.querySelector(`[data-line-id="${selectedLineRef.current}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [outputContainerRef]);

  /** Обёртка навигации — устанавливает флаг скролла */
  const handleNextMatch = useCallback(() => {
    goToNextMatch();
    setShouldScrollToMatch(true);
  }, [goToNextMatch]);

  const handlePrevMatch = useCallback(() => {
    goToPrevMatch();
    setShouldScrollToMatch(true);
  }, [goToPrevMatch]);

  /** При вводе текста — не скроллим */
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setShouldScrollToMatch(false);
  }, [setSearchQuery]);

  /** ID строки с текущим активным совпадением */
  const currentMatchLineId = matchIndices.length > 0
    ? visibleLines[matchIndices[currentMatchIndex]]?.id
    : undefined;

  return (
    <div
      className={`overflow-hidden ${themeClasses.terminalBgClass} ${themeClasses.terminalTextClass} font-mono text-sm w-full h-full flex flex-col ${isVisible ? 'opacity-100' : 'hidden'}`}
    >
      <TerminalFilterBar
        filter={filter}
        onFilterChange={setFilter}
        stderrCount={stderrCount(lines)}
        onZoomIn={() => adjustScale(1.2)}
        onZoomOut={() => adjustScale(0.8)}
        onClear={clearTerminal}
        onCopy={(format) => copyTerminalOutput(visibleLines, format)}
        onSave={(format) => saveTerminalOutput(visibleLines, format)}
      />
      <TerminalSearchBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        currentMatch={currentMatchIndex}
        totalMatches={matchIndices.length}
        onNext={handleNextMatch}
        onPrev={handlePrevMatch}
      />
      <div className="flex-1 overflow-hidden min-h-0 flex">
        <div className="flex-1 min-w-0">
          <TerminalOutput
            lines={visibleLines}
            containerRef={outputContainerRef}
            scale={scale}
            terminalTextClass={themeClasses.terminalTextClass}
            stderrTextClass={themeClasses.stderrTextClass}
            placeholderTextClass={themeClasses.placeholderTextClass}
            searchQuery={searchQuery || undefined}
            currentMatchLineId={currentMatchLineId}
            shouldScrollToMatch={shouldScrollToMatch}
            onLineClick={setSelectedLineId}
            selectedLineId={selectedLineId ?? undefined}
          />
        </div>
        {selectedLineId && (
          <TerminalLogDetail
            line={visibleLines.find(l => l.id === selectedLineId)}
            onClose={() => setSelectedLineId(null)}
            onPrev={handleDetailPrev}
            onNext={handleDetailNext}
            onScrollToLine={handleScrollToLine}
          />
        )}
      </div>
    </div>
  );
});
