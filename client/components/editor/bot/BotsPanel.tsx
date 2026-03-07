/**
 * @fileoverview Левая панель со списком ботов
 *
 * Компонент отображает панель управления ботами
 * без встроенных терминалов.
 *
 * @module bot/BotsPanel
 */

import { ResizablePanel } from '@/components/ui/resizable';
import { BotControl } from './bot-control';
import { useActiveTerminals } from './ActiveTerminalsContext';

interface BotsPanelProps {
  /** Минимальный размер панели в процентах */
  defaultSize?: number;
}

/**
 * Панель ботов
 */
export function BotsPanel({ defaultSize = 70 }: BotsPanelProps) {
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
    <ResizablePanel defaultSize={defaultSize} minSize={30}>
      <div className="h-full overflow-auto p-4 sm:p-6">
        <BotControl
          onBotStarted={handleBotStarted}
          onBotStopped={handleBotStopped}
        />
      </div>
    </ResizablePanel>
  );
}
