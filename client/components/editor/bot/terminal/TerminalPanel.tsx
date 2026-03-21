/**
 * @fileoverview Правая панель с терминалами ботов
 *
 * Отображает вкладки терминалов и активный терминал.
 * Реализует lazy mount: терминал монтируется только при первом
 * переключении на него, что предотвращает лишние WebSocket-соединения.
 *
 * @module bot/TerminalPanel
 */

import { useState, useCallback } from 'react';
import { BotTerminal } from './BotTerminal';
import { TerminalTabs } from './TerminalTabs';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import type { TerminalInfo } from '../contexts/ActiveTerminalsContext';

/**
 * Панель терминалов с lazy mount
 */
export function TerminalPanel() {
  const { activeTerminalId, terminals } = useActiveTerminals();

  /**
   * Множество ключей терминалов, которые уже были смонтированы хотя бы раз.
   * Используем Set для O(1) проверки.
   */
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(() => {
    // Монтируем активный терминал сразу при инициализации
    const initial = new Set<string>();
    if (activeTerminalId) initial.add(activeTerminalId);
    return initial;
  });

  /** Обработчик выбора вкладки — добавляем ключ в mountedTabs */
  const handleTerminalSelect = useCallback((projectId: number, tokenId: number) => {
    const key = `${projectId}_${tokenId}`;
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
          const key = `${terminal.projectId}_${terminal.tokenId}`;
          const isActive = key === activeTerminalId;

          // Монтируем только если вкладка уже была открыта хотя бы раз
          if (!mountedTabs.has(key) && !isActive) return null;

          return (
            <div
              key={key}
              className={isActive ? 'block h-full' : 'hidden'}
            >
              <BotTerminal
                projectId={terminal.projectId}
                tokenId={terminal.tokenId}
                isBotRunning={terminal.isRunning}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
