/**
 * @fileoverview Правая панель с терминалами ботов
 *
 * Компонент отображает панель с вкладками терминалов
 * и активным терминалом.
 *
 * @module bot/TerminalPanel
 */

import { ResizablePanel } from '@/components/ui/resizable';
import { Terminal as TerminalComponent, type TerminalHandle } from './Terminal';
import { BotTerminal } from './BotTerminal';
import { TerminalTabs } from './TerminalTabs';
import { useActiveTerminals } from './ActiveTerminalsContext';
import { useRef, useState } from 'react';

interface TerminalPanelProps {
  /** Минимальный размер панели в процентах */
  defaultSize?: number;
}

/**
 * Панель терминалов
 */
export function TerminalPanel({ defaultSize = 30 }: TerminalPanelProps) {
  const { activeTerminalId, terminals } = useActiveTerminals();
  const terminalRef = useRef<TerminalHandle>(null);
  const [visibleTerminals, setVisibleTerminals] = useState<Record<string, boolean>>({});

  const handleTerminalSelect = (projectId: number, tokenId: number) => {
    const key = `${projectId}_${tokenId}`;
    setVisibleTerminals(prev => ({ ...prev, [key]: true }));
  };

  if (terminals.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Терминалы не активны</p>
          <p className="text-sm">Запустите бота, чтобы увидеть его логи</p>
        </div>
      </div>
    );
  }

  const [projectIdStr, tokenIdStr] = (activeTerminalId || '').split('_');
  const activeProjectId = parseInt(projectIdStr);
  const activeTokenId = parseInt(tokenIdStr);

  return (
    <ResizablePanel defaultSize={defaultSize} minSize={20}>
      <div className="h-full flex flex-col">
        <TerminalTabs onTerminalSelect={handleTerminalSelect} />
        <div className="flex-1 overflow-auto p-2">
          {terminals.map(terminal => {
            const key = `${terminal.projectId}_${terminal.tokenId}`;
            const isActive = key === activeTerminalId;
            const isVisible = visibleTerminals[key] || isActive;

            if (!isVisible) return null;

            return (
              <div
                key={key}
                className={isActive ? 'block' : 'hidden'}
              >
                <BotTerminal
                  projectId={terminal.projectId}
                  tokenId={terminal.tokenId}
                  isBotRunning={terminal.isRunning}
                />
              </div>
            );
          })}
        </div>
      </div>
    </ResizablePanel>
  );
}
