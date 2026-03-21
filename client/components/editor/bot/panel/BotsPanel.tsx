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
  const { addTerminal, updateTerminalStatus, terminals } = useActiveTerminals();
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
    if (tokens.length > 0 && terminals.length === 0) {
      tokens.forEach((token: BotToken, index: number) => {
        const statusResponse = tokenStatuses[index]?.data as BotStatusResponse | undefined;
        if (statusResponse?.status === 'running' && statusResponse?.instance) {
          addTerminal({
            projectId: token.projectId,
            tokenId: token.id,
            botName: token.name || `${projectName} #${token.id}`,
            isRunning: true
          });
        }
      });
    }
  }, [tokens, tokenStatuses, terminals.length, projectId, projectName]);

  // Обработчик запуска бота
  const handleBotStarted = (projectId: number, tokenId: number, botName: string) => {
    // Очищаем логи перед запуском
    const logKey = `${projectId}-${tokenId}`;
    clearLogs(logKey);
    addTerminal({ projectId, tokenId, botName, isRunning: true });
  };

  // Обработчик остановки бота
  const handleBotStopped = (projectId: number, tokenId: number) => {
    updateTerminalStatus(projectId, tokenId, false);
  };

  return (
    <div className="h-full overflow-auto p-3 sm:p-4 lg:p-6">
      <BotControl
        projectId={projectId}
        projectName={projectName}
        onBotStarted={handleBotStarted}
        onBotStopped={handleBotStopped}
      />
    </div>
  );
}
