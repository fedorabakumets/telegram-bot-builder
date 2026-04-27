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
import { useQuery, useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiRequest } from '@/queryClient';
import { BotToken } from '@shared/schema';
import { getBotDisplayName } from '../contexts/bot-control-utils';

interface BotsPanelProps {
  projectId: number;
  projectName: string;
}

interface BotStatusResponse {
  status: string;
  instance: any;
}

/**
 * Панель ботов
 */
export function BotsPanel({ projectId, projectName }: BotsPanelProps) {
  const { addTerminal, updateTerminalStatus, removeTerminal, terminals } = useActiveTerminals();
  const { clearLogs } = useBotLogs();

  // Получаем токены проекта
  const { data: tokens = [] } = useQuery<BotToken[]>({
    queryKey: [`/api/projects/${projectId}/tokens`],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/tokens`),
    refetchInterval: false,
  });
  
  // Получаем статусы для каждого токена
  const tokenStatuses = useQueries({
    queries: tokens.map((token: BotToken) => ({
      queryKey: [`/api/tokens/${token.id}/bot-status`],
      queryFn: () => apiRequest('GET', `/api/tokens/${token.id}/bot-status`),
      refetchInterval: false,
    }))
  });
  
  // Инициализируем терминалы при загрузке для запущенных ботов
  useEffect(() => {
    if (tokens.length === 0) return;
    tokens.forEach((token: BotToken, index: number) => {
      const statusResponse = tokenStatuses[index]?.data as BotStatusResponse | undefined;
      if (statusResponse?.status === 'running') {
        const alreadyOpen = terminals.some(
          t => t.projectId === token.projectId && t.tokenId === token.id && t.tabType !== 'history'
        );
        if (!alreadyOpen) {
          addTerminal({
            projectId: token.projectId,
            tokenId: token.id,
            botName: getBotDisplayName(token, `${projectName} #${token.id}`),
            isRunning: true
          });
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, ...tokenStatuses.map(s => (s.data as BotStatusResponse | undefined)?.status)]);

  // Обработчик запуска бота
  const handleBotStarted = (projectId: number, tokenId: number, botName: string) => {
    const logKey = `${projectId}-${tokenId}`;
    clearLogs(logKey);
    addTerminal({ projectId, tokenId, botName, isRunning: true });
  };

  // Очистка логов при получении bot-started через WebSocket (срабатывает на всех вкладках)
  const handleBotStartedWs = (projectId: number, tokenId: number) => {
    clearLogs(`${projectId}-${tokenId}`);
  };

  // Обработчик остановки бота
  const handleBotStopped = (projectId: number, tokenId: number) => {
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
    <div className="h-full overflow-auto p-3 sm:p-4 lg:p-6">
      <BotControl
        projectId={projectId}
        projectName={projectName}
        onBotStarted={handleBotStarted}
        onBotStopped={handleBotStopped}
        onBotDeleted={handleBotDeleted}
        onTokenCreated={handleTokenCreated}
        onBotStartedWs={handleBotStartedWs}
      />
    </div>
  );
}
