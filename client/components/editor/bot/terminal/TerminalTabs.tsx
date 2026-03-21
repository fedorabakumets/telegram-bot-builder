/**
 * @fileoverview Компонент вкладок терминалов
 *
 * Отображает вкладки для переключения между терминалами ботов.
 *
 * @module bot/TerminalTabs
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import { Terminal, Bot } from 'lucide-react';

/**
 * Свойства компонента вкладок терминалов
 */
interface TerminalTabsProps {
  /** Обработчик выбора терминала */
  onTerminalSelect: (projectId: number, tokenId: number) => void;
}

/**
 * Вкладки терминалов
 */
export function TerminalTabs({ onTerminalSelect }: TerminalTabsProps) {
  const { terminals, activeTerminalId, setActiveTerminal } = useActiveTerminals();

  if (terminals.length === 0) {
    return null;
  }

  return (
    <Tabs value={activeTerminalId || ''} onValueChange={(value) => {
      const [projectId, tokenId] = value.split('_').map(Number);
      setActiveTerminal(projectId, tokenId);
      onTerminalSelect(projectId, tokenId);
    }}>
      <TabsList className="w-full justify-start">
        {terminals.map(terminal => (
          <TabsTrigger
            key={`${terminal.projectId}_${terminal.tokenId}`}
            value={`${terminal.projectId}_${terminal.tokenId}`}
            className="flex items-center gap-2"
          >
            {terminal.isRunning ? (
              <Terminal className="w-3 h-3 text-green-500" />
            ) : (
              <Bot className="w-3 h-3 text-gray-400" />
            )}
            <span className="max-w-[150px] truncate">{terminal.botName}</span>
            {terminal.isRunning && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
