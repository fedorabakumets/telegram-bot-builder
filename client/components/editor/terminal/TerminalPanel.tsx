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
import { WorkspaceTabActions } from '@/components/ui/workspace-tab-actions';
import { useQueryClient } from '@tanstack/react-query';
import { BotTerminal } from './BotTerminal';
import { LaunchHistoryViewer } from './LaunchHistoryViewer';
import { TerminalTabs } from './TerminalTabs';
import { useActiveTerminals } from '../bot/contexts/ActiveTerminalsContext';
import type { TerminalInfo } from '../bot/contexts/ActiveTerminalsContext';
import { useBotQueries } from '../bot/hooks/use-bot-queries';
import { getBotDisplayName } from '../bot/contexts/bot-control-utils';
import { ProjectSelector } from '../database/user-database/components/header/project-selector';

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

/** Пропсы панели терминалов */
interface TerminalPanelProps {
  /** Список всех проектов для переключателя */
  allProjects?: Array<{ id: number; name: string }>;
  /** ID текущего проекта */
  currentProjectId?: number;
  /** Обработчик смены проекта */
  onProjectChange?: (projectId: number) => void;
}

/**
 * Панель терминалов с TabHeader и lazy mount.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalPanel({ allProjects, currentProjectId, onProjectChange }: TerminalPanelProps) {
  const queryClient = useQueryClient();
  const { activeTerminalId, terminals, addTerminal } = useActiveTerminals();
  /** Активная запись должна относиться к проекту, открытому в шапке. */
  const active = terminals.find(terminal => getTabKey(terminal) === activeTerminalId &&
    (currentProjectId == null || terminal.projectId === currentProjectId));
  /** Перечитывает сохранённые запуски и записи, уже открытые в терминале. */
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['launch-history', active?.tokenId].filter(id => id != null) });
    if (active?.launchId != null) void queryClient.invalidateQueries({ queryKey: ['launch-logs', active.launchId] });
    else if (active) void queryClient.invalidateQueries({
      queryKey: ['/api/projects', active.projectId, 'tokens', active.tokenId, 'logs', 'current-launch'],
    });
  };
  const actions = <WorkspaceTabActions docsPath="interface/terminal" section="Терминал" onRefresh={refresh} />;
  const { allTokensFlat, allBotStatuses } = useBotQueries({ includeBotInfo: false });

  /** Автоматический выбор применяется только в пустом терминале проекта. */
  useEffect(() => {
    if (activeTerminalId || allTokensFlat.length === 0 || allBotStatuses.length === 0) return;

    const token = allTokensFlat.find(candidate =>
      (currentProjectId == null || candidate.projectId === currentProjectId) &&
      allBotStatuses.some(status => status.tokenId === candidate.id && status.status === 'running'),
    );
    if (token) {
      const statusEntry = allBotStatuses.find(s => s.tokenId === token.id);
      if (statusEntry?.status === 'running') {
        addTerminal({
          projectId: token.projectId,
          tokenId: token.id,
          botName: getBotDisplayName(token, `Bot #${token.id}`),
          isRunning: true,
        });
      }
    }
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

  /** Одна и та же строка селекторов работает с активным терминалом и без него. */
  const header = (
    <TabHeader
      className="terminal-workspace-header"
      icon={<TerminalIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
      title="Терминал"
      actions={actions}
    >
      <div className="flex min-w-0 max-w-full items-center gap-2">
        {allProjects && allProjects.length > 1 && onProjectChange && currentProjectId && (
          <ProjectSelector
            projects={allProjects}
            selectedProjectId={currentProjectId}
            showBotCount={false}
            ariaLabel="Проект терминала"
            onSelect={onProjectChange}
          />
        )}
        <TerminalTabs currentProjectId={currentProjectId} onTerminalSelect={handleTerminalSelect} />
      </div>
    </TabHeader>
  );

  if (!active) {
    return (
      <div className="flex flex-col h-full bg-background">
        {header}
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Терминалы не активны</p>
            <p className="text-sm">Выберите бота, чтобы открыть его логи и историю запусков</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {header}

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
                  botName={terminal.botName}
                />
              ) : (
                <BotTerminal
                  projectId={terminal.projectId}
                  tokenId={terminal.tokenId}
                  isBotRunning={allBotStatuses.find(status => status.tokenId === terminal.tokenId)
                    ? allBotStatuses.some(status => status.tokenId === terminal.tokenId && status.status === 'running')
                    : terminal.isRunning}
                  botName={terminal.botName}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
