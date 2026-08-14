/**
 * @fileoverview Левая панель со списком ботов
 *
 * Компонент отображает панель управления ботами
 * без встроенных терминалов.
 *
 * @module bot/BotsPanel
 */

import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import { BotControl } from '../bot-control';
import { useBotLogs } from '../contexts/bot-logs-context';
import { clearBotLogsOnce } from '../contexts/clear-bot-logs-once';
import { useEffect } from 'react';
import { getBotDisplayName } from '../contexts/bot-control-utils';
import { useBotQueries } from '../hooks/use-bot-queries';

interface BotsPanelProps {
  projectId: number;
  projectName: string;
  /** Список всех проектов для переключателя */
  allProjects?: Array<{ id: number; name: string }>;
  /** Обработчик смены проекта */
  onProjectChange?: (projectId: number) => void;
}

interface BotStatusResponse {
  status: string;
  instance: any;
}

/**
 * Панель ботов
 */
export function BotsPanel({ projectId, projectName, allProjects, onProjectChange }: BotsPanelProps) {
  const { addTerminal, updateTerminalStatus, removeTerminal } = useActiveTerminals();
  const { clearLogs } = useBotLogs();

  // Загружаем все токены всех проектов для инициализации терминалов
  const { allTokensFlat, allBotStatuses } = useBotQueries({ includeBotInfo: false });

  // Инициализируем терминалы при загрузке для всех запущенных ботов (все проекты)
  useEffect(() => {
    if (allTokensFlat.length === 0 || allBotStatuses.length === 0) return;

    allTokensFlat.forEach(token => {
      const statusEntry = allBotStatuses.find(s => s.tokenId === token.id);
      if (statusEntry?.status === 'running') {
        addTerminal({
          projectId: token.projectId,
          tokenId: token.id,
          botName: getBotDisplayName(token, `Bot #${token.id}`),
          isRunning: true
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(allTokensFlat.map(t => t.id)),
    JSON.stringify(allBotStatuses.map(s => ({ id: s.tokenId, status: s.status }))),
  ]);

  // Обработчик запуска бота (mutation) — очищаем старые логи один раз
  const handleBotStarted = (projectId: number, tokenId: number, botName: string) => {
    clearBotLogsOnce(clearLogs, projectId, tokenId);
    addTerminal({ projectId, tokenId, botName, isRunning: true });
  };

  // WS bot-started: тот же clear с cooldown — Redis шлёт второе событие после main()
  const handleBotStartedWs = (projectId: number, tokenId: number) => {
    clearBotLogsOnce(clearLogs, projectId, tokenId);
  };

  // Обработчик остановки бота — очищаем логи и обновляем статус терминала
  const handleBotStopped = (projectId: number, tokenId: number) => {
    clearLogs(`${projectId}-${tokenId}`);
    updateTerminalStatus(projectId, tokenId, false);
  };

  // Обработчик удаления бота — убираем терминальную вкладку
  const handleBotDeleted = (projectId: number, tokenId: number) => {
    removeTerminal(projectId, tokenId);
  };

  /**
   * Обработчик создания нового токена через внешний Telegram-бот.
   * Автоматически открывает терминальную вкладку для нового бота.
   * @param pid - ID проекта
   * @param tokenId - ID нового токена
   * @param tokenName - Имя нового токена
   */
  const handleTokenCreated = (pid: number, tokenId: number, tokenName: string) => {
    addTerminal({
      projectId: pid,
      tokenId,
      botName: tokenName || `Bot #${tokenId}`,
      isRunning: false,
    });
  };

  return (
    <div className="h-full overflow-hidden">
      <BotControl
        projectId={projectId}
        projectName={projectName}
        onBotStarted={handleBotStarted}
        onBotStopped={handleBotStopped}
        onBotDeleted={handleBotDeleted}
        onTokenCreated={handleTokenCreated}
        onBotStartedWs={handleBotStartedWs}
        allProjects={allProjects}
        onProjectChange={onProjectChange}
      />
    </div>
  );
}
