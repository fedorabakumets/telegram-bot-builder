/**
 * @fileoverview Компонент терминала для конкретного бота
 * @module bot/BotTerminal
 */

import { useTerminalWebSocket } from './use-terminal-websocket';
import { useEffect, useRef } from 'react';
import { Terminal as TerminalComponent, type TerminalHandle } from './Terminal';
import { TerminalLogsContextBar } from './TerminalLogsContextBar';

interface BotTerminalProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена бота */
  tokenId: number;
  /** Флаг, указывающий, запущен ли бот */
  isBotRunning?: boolean;
}

/**
 * Живые логи бота: context bar + Terminal
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotTerminal({ projectId, tokenId, isBotRunning = false }: BotTerminalProps) {
  const terminalRef = useRef<TerminalHandle>(null);

  const { status: wsStatus, wsConnection, connect } = useTerminalWebSocket({
    terminalRef,
    projectId: projectId || null,
    tokenId: tokenId || null,
  });

  useEffect(() => {
    if (wsStatus === 'disconnected') {
      connect();
    }
  }, [wsStatus, connect]);

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <TerminalLogsContextBar
        title="Живые логи"
        subtitle={`token #${tokenId}`}
        statusLabel={isBotRunning ? 'Онлайн' : 'Офлайн'}
        statusClassName={
          isBotRunning
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-muted text-muted-foreground border-border'
        }
      />
      <div className="flex-1 min-h-0">
        <TerminalComponent
          ref={terminalRef}
          isVisible={true}
          wsConnection={wsConnection}
          projectId={projectId}
          tokenId={tokenId}
        />
      </div>
    </div>
  );
}
