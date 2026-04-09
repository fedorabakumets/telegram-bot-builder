/**
 * @fileoverview Правая панель с терминалами ботов
 *
 * Отображает вкладки терминалов и активный терминал или просмотрщик истории.
 * Реализует lazy mount: компонент монтируется только при первом открытии вкладки.
 *
 * @module bot/TerminalPanel
 */

import { useState, useCallback } from 'react';
import { BotTerminal } from './BotTerminal';
import { LaunchHistoryViewer } from './LaunchHistoryViewer';
import { TerminalTabs } from './TerminalTabs';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import type { TerminalInfo } from '../contexts/ActiveTerminalsContext';

/**
 * Возвращает строковый ключ вкладки терминала
 * @param terminal - Информация о терминале
 * @returns Строковый ключ
 */
function getTabKey(terminal: TerminalInfo): string {
  return terminal.tabType === 'history'
    ? `history_${terminal.launchId}`
    : `${terminal.projectId}_${terminal.tokenId}`;
}

/**
 * Панель терминалов с lazy mount и поддержкой history-вкладок
 * @returns JSX элемент
 */
export function TerminalPanel() {
  const { activeTerminalId, terminals } = useActiveTerminals();

  const [mountedTabs, setMountedTabs] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (activeTerminalId) initial.add(activeTerminalId);
    return initial;
  });

  /**
   * Обработчик выбора вкладки — добавляем ключ в mountedTabs
   * @param key - Строковый ключ вкладки
   */
  const handleTerminalSelect = useCallback((key: string) => {
    setMountedTabs(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  if (terminals.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Терминалы не активны</p>
          <p className="text-sm">Запустите бота, чтобы увидеть его логи</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <TerminalTabs onTerminalSelect={handleTerminalSelect} />
      <div className="flex-1 overflow-hidden p-2">
        {terminals.map((terminal: TerminalInfo) => {
          const key = getTabKey(terminal);
          const isActive = key === activeTerminalId;
          const isHistory = terminal.tabType === 'history';

          if (!mountedTabs.has(key) && !isActive) return null;

          return (
            <div key={key} className={isActive ? 'block h-full' : 'hidden'}>
              {isHistory ? (
                <LaunchHistoryViewer
                  launchId={terminal.launchId!}
                  startedAt={terminal.launchStartedAt ?? null}
                />
              ) : (
                <BotTerminal
                  projectId={terminal.projectId}
                  tokenId={terminal.tokenId}
                  isBotRunning={terminal.isRunning}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
