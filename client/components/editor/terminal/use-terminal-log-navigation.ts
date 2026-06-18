/**
 * @fileoverview Открытие терминала по ?log= и ?bot= при загрузке редактора
 * @module terminal/use-terminal-log-navigation
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getLogIdFromUrl } from './terminal-log-permalink';
import { useActiveTerminals } from '../bot/contexts/ActiveTerminalsContext';
import { resolveBotDisplayNameFromCache } from '../bot/contexts/bot-control-utils';

/** Параметры хука */
interface UseTerminalLogNavigationParams {
  /** ID активного проекта */
  projectId: number | undefined;
  /** Переключить вкладку редактора */
  onOpenTerminalTab: () => void;
}

/**
 * При наличии ?log= и ?bot= в URL открывает вкладку «Терминал» и активирует нужного бота
 * @param params - Параметры хука
 */
export function useTerminalLogNavigation({
  projectId,
  onOpenTerminalTab,
}: UseTerminalLogNavigationParams): void {
  const queryClient = useQueryClient();
  const { addTerminal, setActiveTerminal } = useActiveTerminals();

  useEffect(() => {
    if (!projectId) return;

    const logId = getLogIdFromUrl();
    if (!logId) return;

    const botParam = new URLSearchParams(window.location.search).get('bot');
    if (!botParam) return;

    const tokenId = parseInt(botParam, 10);
    if (!tokenId) return;

    onOpenTerminalTab();
    addTerminal({
      projectId,
      tokenId,
      botName: resolveBotDisplayNameFromCache(queryClient, projectId, tokenId),
      isRunning: false,
    });
    setActiveTerminal(projectId, tokenId);
  }, [projectId, queryClient, addTerminal, setActiveTerminal, onOpenTerminalTab]);
}
