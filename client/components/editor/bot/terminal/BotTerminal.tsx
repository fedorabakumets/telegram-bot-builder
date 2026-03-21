/**
 * @fileoverview Компонент терминала для конкретного бота
 *
 * Этот компонент предоставляет терминал для вывода логов бота.
 *
 * @module bot/BotTerminal
 */

import { useTerminalWebSocket } from './use-terminal-websocket';
import { useEffect, useRef } from 'react';
import { Terminal as TerminalComponent, type TerminalHandle } from './Terminal';

interface BotTerminalProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена бота */
  tokenId: number;
  /** Флаг, указывающий, запущен ли бот */
  isBotRunning: boolean;
}

/**
 * Компонент терминала для конкретного бота
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена бота
 * @param isBotRunning - Флаг, указывающий, запущен ли бот
 */
export function BotTerminal({ projectId, tokenId }: Omit<BotTerminalProps, 'isBotRunning'> & { isBotRunning?: boolean }) {
  const terminalRef = useRef<TerminalHandle>(null);

  // WebSocket для получения вывода бота
  const { status: wsStatus, wsConnection, connect } = useTerminalWebSocket({
    terminalRef,
    projectId: projectId || null,
    tokenId: tokenId || null
  });

  // Подключаемся при монтировании и переподключаемся при изменении статуса на disconnected
  useEffect(() => {
    if (wsStatus === 'disconnected') {
      console.log('Подключение к терминалу, статус:', wsStatus);
      connect();
    }
  }, [wsStatus, connect]);

  return (
    <div className="h-full w-full">
      <TerminalComponent
        ref={terminalRef}
        isVisible={true}
        wsConnection={wsConnection}
        projectId={projectId}
        tokenId={tokenId}
      />
    </div>
  );
}