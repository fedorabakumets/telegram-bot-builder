/**
 * @fileoverview Правая detail-панель бота на холсте (как Railway)
 * @module bot/canvas/BotDetailPanel
 */

import { useState } from 'react';
import { X, Play, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BotSettingsGrid } from '../card/BotSettingsGrid';
import { BotEnvPanel } from '../card/BotEnvPanel';
import { BotEnvStagingBar } from '../card/BotEnvStagingBar';
import { BotLaunchHistory } from '../card/BotLaunchHistory';
import { useEnvPendingChanges } from '../card/use-env-pending-changes';
import { BotTerminal } from '../../terminal/BotTerminal';
import { LaunchHistoryViewer } from '../../terminal/LaunchHistoryViewer';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import { useBotControl } from '../bot-control-context';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { BotDetailTabs } from './BotDetailTabs';
import { BotDetailTabProvider, type BotDetailTabId } from './bot-detail-tab-context';
import type { BotProject, BotToken } from '@shared/schema';

/** Пропсы detail-панели */
interface BotDetailPanelProps {
  /** Проект */
  project: BotProject;
  /** Токен */
  token: BotToken;
  /** Запущен ли бот */
  isRunning: boolean;
  /** Закрыть панель */
  onClose: () => void;
  /** Мобильный sheet-режим */
  compact?: boolean;
}

/**
 * Панель с вкладками История / Настройки / Переменные / Терминал
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotDetailPanel({
  project,
  token,
  isRunning,
  onClose,
  compact = false,
}: BotDetailPanelProps) {
  const [tab, setTab] = useState<BotDetailTabId>('settings');
  const pending = useEnvPendingChanges(project.id, token.id);
  const { startBotMutation, stopBotMutation, deleteBotMutation, toggleDatabaseMutation } = useBotControl();
  const { user, isTelegramUser } = useTelegramAuth();
  const { terminals, activeTerminalId } = useActiveTerminals();
  const canManage = !!(user && isTelegramUser(user));
  const title = token.botFirstName || token.name || `Бот ${token.id}`;

  const historyTerminal = terminals.find(
    (t) =>
      t.tabType === 'history' &&
      t.tokenId === token.id &&
      activeTerminalId === `history_${t.launchId}`,
  );

  return (
    <BotDetailTabProvider setTab={setTab}>
      <div className={['flex flex-col h-full bg-background border-l border-border', compact ? '' : 'min-w-0'].join(' ')}>
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border flex-shrink-0">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{title}</div>
            {token.botUsername && (
              <div className="text-xs text-muted-foreground truncate">@{token.botUsername}</div>
            )}
          </div>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={startBotMutation.isPending || stopBotMutation.isPending}
            onClick={() => isRunning
              ? stopBotMutation.mutate({ tokenId: token.id, projectId: project.id })
              : startBotMutation.mutate({ tokenId: token.id, projectId: project.id })}
            aria-label={isRunning ? 'Остановить' : 'Запустить'}
          >
            {isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" disabled={deleteBotMutation.isPending}
            onClick={() => deleteBotMutation.mutate(token.id)}
            aria-label="Удалить"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onClose} aria-label="Закрыть">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-3 py-2 border-b border-border flex-shrink-0">
          <BotDetailTabs value={tab} onChange={setTab} />
        </div>
        {pending.changesCount > 0 && (
          <div className="px-3 pt-2 flex-shrink-0">
            <BotEnvStagingBar
              changesCount={pending.changesCount}
              isSaving={pending.isSaving}
              onDiscard={pending.discardAll}
              onSave={pending.saveAll}
              onSaveAndRestart={pending.saveAndRestart}
            />
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto p-3">
          {tab === 'history' && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">История</p>
              <BotLaunchHistory tokenId={token.id} projectId={project.id} botName={title} />
            </div>
          )}
          {tab === 'settings' && (
            <BotSettingsGrid
              projectId={project.id}
              tokenId={token.id}
              botName={title}
              userDatabaseEnabled={project.userDatabaseEnabled}
              token={token}
              toggleDatabaseMutation={toggleDatabaseMutation}
              launchMode={token.launchMode ?? 'polling'}
              webhookBaseUrl={token.webhookBaseUrl ?? null}
              webhookSecretToken={token.webhookSecretToken ?? null}
              canManage={canManage}
              onPendingChange={(key, value) => pending.addChange({ action: 'update', type: 'system', key, value })}
            />
          )}
          {tab === 'variables' && (
            <BotEnvPanel
              projectId={project.id}
              tokenId={token.id}
              token={token}
              adminIds={project.adminIds || ''}
              pending={pending}
            />
          )}
          {tab === 'terminal' && (
            <div className="h-full min-h-[240px]">
              {historyTerminal?.launchId != null ? (
                <LaunchHistoryViewer
                  launchId={historyTerminal.launchId}
                  startedAt={historyTerminal.launchStartedAt ?? null}
                />
              ) : (
                <BotTerminal projectId={project.id} tokenId={token.id} isBotRunning={isRunning} />
              )}
            </div>
          )}
        </div>
      </div>
    </BotDetailTabProvider>
  );
}
