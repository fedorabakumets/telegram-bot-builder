/**
 * @fileoverview Левая панель со списком ботов
 *
 * Компонент отображает панель управления ботами
 * без встроенных терминалов.
 *
 * @module bot/BotsPanel
 */

import { useActiveTerminals } from './ActiveTerminalsContext';
import { BotControl } from './bot-control';
import { useQuery, useQueries, useEffect } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface BotsPanelProps {
  projectId: number;
  projectName: string;
}

/**
 * Панель ботов
 */
export function BotsPanel({ projectId, projectName }: BotsPanelProps) {
  const { addTerminal, updateTerminalStatus, terminals } = useActiveTerminals();
  
  // Получаем токены проекта
  const { data: tokens = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/tokens`],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/tokens`),
    refetchInterval: false,
  });
  
  // Получаем статусы для каждого токена
  const tokenStatuses = useQueries({
    queries: tokens.map(token => ({
      queryKey: [`/api/tokens/${token.id}/bot-status`],
      queryFn: () => apiRequest('GET', `/api/tokens/${token.id}/bot-status`),
      refetchInterval: false,
    }))
  });
  
  // Инициализируем терминалы при загрузке для запущенных ботов
  useEffect(() => {
    if (tokens.length > 0 && terminals.length === 0) {
      tokens.forEach((token, index) => {
        const statusResponse = tokenStatuses[index]?.data;
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
    addTerminal({ projectId, tokenId, botName, isRunning: true });
  };

  // Обработчик остановки бота
  const handleBotStopped = (projectId: number, tokenId: number) => {
    updateTerminalStatus(projectId, tokenId, false);
  };

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <BotControl
        projectId={projectId}
        projectName={projectName}
        onBotStarted={handleBotStarted}
        onBotStopped={handleBotStopped}
      />
    </div>
  );
}
