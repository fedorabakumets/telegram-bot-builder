/**
 * @fileoverview Панель терминалов ботов
 *
 * Отображает вкладки терминалов и активный терминал или просмотрщик истории.
 * Реализует lazy mount: компонент монтируется только при первом открытии вкладки.
 * Использует TabHeader для единообразия с другими вкладками приложения.
 * Автоматически регистрирует терминалы для запущенных ботов при монтировании.
 *
 * @module terminal/TerminalPanel
 */

import { useState, useCallback, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { TabHeader } from '@/components/ui/tab-header';
import { BotTerminal } from './BotTerminal';
import { LaunchHistoryViewer } from './LaunchHistoryViewer';
import { TerminalTabs } from './TerminalTabs';
import { useActiveTerminals } from '../bot/contexts/ActiveTerminalsContext';
import type { TerminalInfo } from '../bot/contexts/ActiveTerminalsContext';
import { useBotQueries } from '../bot/hooks/use-bot-queries';
import { getBotDisplayName } from '../bot/contexts/bot-control-utils';

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
 * Панель терминалов с TabHeader и lazy mount.
 * @returns JSX элемент
 */
export function TerminalPanel() {
  const { activeTerminalId, terminals, addTerminal } = useActiveTerminals();
  const { allTokensFlat, allBotStatuses } = useBotQueries();

  // Автоматическая регистрация терминалов для запущенных ботов
  useEffect(() => {
    if (allTokensFlat.length === 0 || allBotStatuses.length === 0) return;

    allTokensFlat.forEach(token => {
      const statusEntry = allBotStatuses.find(s => s.tokenId === token.id);
      if (statusEntry?.status === 'running') {
        addTerminal({
          projectId: token.projectId,
          tokenId: token.id,
          botName: getBotDisplayName(token, `Bot #${token.id}`),
          isRunning: true,
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(allTokensFlat.map(t => t.id)),
    JSON.stringify(allBotStatuses.map(s => ({ id: s.tokenId, status: s.status }))),
  ]);

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
      <div className="flex flex-col h-full bg-background">
        <TabHeader
          icon={<TerminalIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          title="Терминал"
        />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Терминалы не активны</p>
            <p className="text-sm">Запустите бота, чтобы увидеть его логи</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <TabHeader
        icon={<TerminalIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        title="Терминал"
      >
        <TerminalTabs onTerminalSelect={handleTerminalSelect} />
      </TabHeader>

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
