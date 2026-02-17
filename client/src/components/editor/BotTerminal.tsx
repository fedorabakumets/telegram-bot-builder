/**
 * @fileoverview Компонент терминала для конкретного бота
 * 
 * Этот компонент предоставляет:
 * - Кнопку для отображения/скрытия терминала
 * - Сам терминал, связанный с конкретным ботом
 * - Индикатор статуса подключения к WebSocket
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import { Terminal as TerminalComponent, type TerminalHandle } from './Terminal';
import { useTerminalWebSocket } from '@/hooks/use-terminal-websocket';

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
export function BotTerminal({ projectId, tokenId, isBotRunning }: BotTerminalProps) {
  const [terminalVisible, setTerminalVisible] = useState(false);
  const terminalRef = useRef<TerminalHandle>(null);

  // WebSocket для получения вывода бота
  const { status: wsStatus, wsConnection, connect } = useTerminalWebSocket({
    terminalRef,
    projectId: projectId || null,
    tokenId: isBotRunning ? tokenId : null
  });

  // При остановке бота не скрываем терминал, чтобы пользователь мог видеть последние сообщения

  // Переподключаемся при возврате на вкладку если бот запущен
  useEffect(() => {
    if (isBotRunning && (!wsConnection || wsConnection.readyState === WebSocket.CLOSED)) {
      console.log('Переподключение к терминалу при возврате на вкладку');
      connect();
    }
  }, [isBotRunning, wsConnection, connect]);

  return (
    <>
      <div className="flex flex-col gap-2 w-full min-w-0">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setTerminalVisible(!terminalVisible)}
            className={`flex items-center justify-center gap-2 w-[160px] h-9 text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              terminalVisible
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40'
                : 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40'
            }`}
            data-testid={`button-toggle-terminal-${tokenId}`}
          >
            <Code className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{terminalVisible ? 'Скрыть терминал' : 'Показать терминал'}</span>
            <span className="sm:hidden">{terminalVisible ? 'Скрыть' : 'Терм'}</span>
          </Button>

          {/* Индикатор статуса подключения к WebSocket */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-secondary text-xs font-medium">
            <div className={`w-2 h-2 rounded-full ${
              wsStatus === 'connected' ? 'bg-green-500' :
              wsStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              wsStatus === 'error' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <span className="capitalize">
              {wsStatus === 'connected' ? 'Подключен' :
               wsStatus === 'connecting' ? 'Подключение...' :
               wsStatus === 'error' ? 'Ошибка' :
               'Отключен'}
            </span>
          </div>
        </div>

        <div className={`transition-all duration-200 ${terminalVisible ? 'opacity-100' : 'opacity-0 h-0 pointer-events-none'}`}>
          <TerminalComponent
            ref={terminalRef}
            isVisible={terminalVisible}
            wsConnection={wsConnection}
            projectId={projectId}
            tokenId={tokenId}
          />
        </div>
      </div>
    </>
  );
}