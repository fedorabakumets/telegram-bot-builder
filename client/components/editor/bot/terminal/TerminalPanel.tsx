/**
 * @fileoverview Правая панель с терминалами ботов
 *
 * Отображает вкладки терминалов и активный терминал или просмотрщик истории.
 * Реализует lazy mount: компонент монтируется только при первом открытии вкладки.
 * Поддерживает режим "Все" — одновременное отображение всех терминалов в стеке.
 *
 * @module bot/TerminalPanel
 */

import { useState, useCallback } from 'react';
import { BotTerminal } from './BotTerminal';
import { LaunchHistoryViewer } from './LaunchHistoryViewer';
import { TerminalTabs, ALL_TERMINALS_VALUE } from './TerminalTabs';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import type { TerminalInfo } from '../contexts/ActiveTerminalsContext';
import { Separator } from '@/components/ui/separator';

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
 * Панель терминалов с lazy mount и поддержкой history-вкладок.
 * При activeTerminalId === 'all' показывает все терминалы в вертикальном стеке.
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

  /** Режим отображения всех терминалов одновременно */
  const isAllMode = activeTerminalId === ALL_TERMINALS_VALUE;

  return (
    <div className="h-full flex flex-col">
      <TerminalTabs onTerminalSelect={handleTerminalSelect} />

      {isAllMode ? (
        <AllTerminalsStack terminals={terminals} />
      ) : (
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
      )}
    </div>
  );
}

/** Пропсы компонента стека всех терминалов */
interface AllTerminalsStackProps {
  /** Список терминалов для отображения */
  terminals: TerminalInfo[];
}

/**
 * Вертикальный стек всех терминалов с заголовками и разделителями
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
function AllTerminalsStack({ terminals }: AllTerminalsStackProps) {
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {terminals.map((terminal, index) => {
        const key = getTabKey(terminal);
        const isHistory = terminal.tabType === 'history';

        return (
          <div key={key}>
            {index > 0 && <Separator className="mb-2" />}
            <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
              {isHistory
                ? `📜 История — ${terminal.botName}`
                : terminal.botName}
              {!isHistory && terminal.isRunning && (
                <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="h-48 min-h-[12rem]">
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
          </div>
        );
      })}
    </div>
  );
}
