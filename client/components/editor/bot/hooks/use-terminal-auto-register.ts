/**
 * @fileoverview Хук автоматической регистрации терминалов запущенных ботов
 *
 * Отслеживает статусы ботов и автоматически добавляет терминалы
 * для запущенных ботов в контекст ActiveTerminals.
 * Работает на уровне приложения, независимо от открытой вкладки.
 *
 * @module bot/hooks/use-terminal-auto-register
 */

import { useEffect } from 'react';
import { useBotQueries } from './use-bot-queries';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';
import { getBotDisplayName } from '../contexts/bot-control-utils';

/**
 * Хук для автоматической регистрации терминалов запущенных ботов
 * Вызывается на уровне провайдера, чтобы терминалы были доступны
 * на любой вкладке приложения.
 */
export function useTerminalAutoRegister(): void {
  const { allTokensFlat, allBotStatuses } = useBotQueries();
  const { addTerminal } = useActiveTerminals();

  useEffect(() => {
    if (allTokensFlat.length === 0 || allBotStatuses.length === 0) return;

    allTokensFlat.forEach(token => {
      const statusEntry = allBotStatuses.find(s => s.tokenId === token.id);
      if (statusEntry?.status === 'running') {
        addTerminal({
          projectId: token.projectId,
          tokenId: token.id,
          botName: getBotDisplayName(token, `Bot #${token.id}`),
          isRunning: true,
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(allTokensFlat.map(t => t.id)),
    JSON.stringify(allBotStatuses.map(s => ({ id: s.tokenId, status: s.status }))),
  ]);
}
