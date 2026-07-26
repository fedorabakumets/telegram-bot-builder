/**
 * @fileoverview Правая detail-панель бота на холсте (как Railway)
 * @module bot/canvas/BotDetailPanel
 */

import { useState } from 'react';
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
import { BotDetailHeader } from './BotDetailHeader';
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
}: BotDetailPanelProps) {
  const [tab, setTab] = useState<BotDetailTabId>('history');
  const pending = useEnvPendingChanges(project.id, token.id);
  const { startBotMutation, stopBotMutation, deleteBotMutation, toggleDatabaseMutation } =
    useBotControl();
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
      <div className="flex h-full min-w-0 flex-col bg-background">
        <BotDetailHeader
          token={token}
          projectId={project.id}
          title={title}
          isRunning={isRunning}
          controlPending={startBotMutation.isPending || stopBotMutation.isPending}
          deletePending={deleteBotMutation.isPending}
          onToggleRun={() =>
            isRunning
              ? stopBotMutation.mutate({ tokenId: token.id, projectId: project.id })
              : startBotMutation.mutate({ tokenId: token.id, projectId: project.id })
          }
          onDelete={() => deleteBotMutation.mutate(token.id)}
          onClose={onClose}
        />
        <BotDetailTabs value={tab} onChange={setTab} />
        {pending.changesCount > 0 && (
          <div className="px-4 pt-3 shrink-0">
            <BotEnvStagingBar
              changesCount={pending.changesCount}
              isSaving={pending.isSaving}
              onDiscard={pending.discardAll}
              onSave={pending.saveAll}
              onSaveAndRestart={pending.saveAndRestart}
            />
          </div>
        )}
        <div
          className={[
            'flex-1 min-h-0 overflow-auto',
            tab === 'terminal' ? 'p-0' : 'bg-background px-4 py-4',
          ].join(' ')}
        >
          {tab === 'history' && (
            <BotLaunchHistory tokenId={token.id} projectId={project.id} botName={title} />
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
              showLaunchHistory={false}
              onPendingChange={(key, value) =>
                pending.addChange({ action: 'update', type: 'system', key, value })
              }
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
