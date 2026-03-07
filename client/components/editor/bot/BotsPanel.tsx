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

interface BotsPanelProps {
  projectId: number;
  projectName: string;
}

/**
 * Панель ботов
 */
export function BotsPanel({ projectId, projectName }: BotsPanelProps) {
  const { addTerminal, updateTerminalStatus } = useActiveTerminals();

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
