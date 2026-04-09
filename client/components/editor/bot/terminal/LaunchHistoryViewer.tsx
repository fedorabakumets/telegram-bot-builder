/**
 * @fileoverview Просмотрщик логов истории запуска бота
 *
 * Отображает статичные логи из БД в стиле терминала.
 * При первой загрузке логов автоматически прокручивает контейнер вниз.
 *
 * @module bot/terminal/LaunchHistoryViewer
 */

import { useRef, useCallback, useEffect } from 'react';
import { useLaunchLogs } from '../hooks/use-launch-logs';
import { useTerminalTheme } from './useTerminalTheme';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import { TerminalOutput } from './TerminalOutput';
import { copyTerminalOutput, saveTerminalOutput } from './terminalUtils';
import { Button } from '@/components/ui/button';
import type { BotLog } from '@shared/schema';

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
 * Преобразует BotLog в формат строки терминала
 * @param log - Запись лога
 * @returns Строка терминала
 */
function botLogToLine(log: BotLog) {
  return {
    id: String(log.id),
    content: log.content,
    type: (log.type === 'status' ? 'stdout' : log.type) as 'stdout' | 'stderr',
  };
}

/**
 * Компонент просмотра логов истории запуска
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function LaunchHistoryViewer({ launchId, startedAt }: LaunchHistoryViewerProps) {
  const { logs, isLoading } = useLaunchLogs(launchId);
  const {
    terminalBgClass, terminalTextClass, headerBgClass,
    buttonTextColorClass, buttonHoverClass, placeholderTextClass, stderrTextClass,
  } = useTerminalTheme();
  // Масштаб для этой конкретной вкладки истории
  const { getTabScale, adjustTabScale } = useActiveTerminals();
  const historyTabId = `history_${launchId}`;
  const scale = getTabScale(historyTabId);
  const adjustScale = useCallback((factor: number) => adjustTabScale(historyTabId, factor), [historyTabId, adjustTabScale]);
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = logs.map(botLogToLine);

  // Прокрутка вниз при первой загрузке логов
  useEffect(() => {
    if (!isLoading && logs.length > 0) {
      const el = containerRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight });
    }
  }, [isLoading, logs.length]);
  const title = `Запуск · ${formatStartedAt(startedAt)}`;

  return (
    <div className={`h-full flex flex-col font-mono text-sm ${terminalBgClass}`}>
      <div className={`${headerBgClass} px-4 py-2 flex justify-between items-center`}>
        <h3 className="font-semibold text-sm">{title}</h3>
        <div className="flex space-x-1 flex-wrap justify-end">
          <Button variant="ghost" size="sm" onClick={() => adjustScale(1.1)}
            className={`${buttonTextColorClass} ${buttonHoverClass}`}>Увеличить</Button>
          <Button variant="ghost" size="sm" onClick={() => adjustScale(0.9)}
            className={`${buttonTextColorClass} ${buttonHoverClass}`}>Уменьшить</Button>
          <Button variant="ghost" size="sm" onClick={() => copyTerminalOutput(lines)}
            className={`${buttonTextColorClass} ${buttonHoverClass}`}>Копировать</Button>
          <Button variant="ghost" size="sm" onClick={() => saveTerminalOutput(lines)}
            className={`${buttonTextColorClass} ${buttonHoverClass}`}>Сохранить</Button>
        </div>
      </div>
      {isLoading ? (
        <div className={`flex-1 flex items-center justify-center ${placeholderTextClass} italic`}>
          Загрузка логов...
        </div>
      ) : logs.length === 0 ? (
        <div className={`flex-1 flex items-center justify-center ${placeholderTextClass} italic`}>
          Логи не сохранены
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <TerminalOutput
            lines={lines}
            containerRef={containerRef}
            scale={scale}
            terminalTextClass={terminalTextClass}
            stderrTextClass={stderrTextClass}
            placeholderTextClass={placeholderTextClass}
          />
        </div>
      )}
    </div>
  );
}
