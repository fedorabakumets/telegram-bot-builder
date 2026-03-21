/**
 * @fileoverview Компонент управления ботами
 *
 * Оркестрирует панель управления ботами:
 * - Загружает данные через useBotQueries
 * - Управляет мутациями через useBotMutations
 * - Предоставляет контекст через BotControlProvider
 * - Рендерит BotControlPanel и BotProfileSheet
 *
 * @module BotControl
 */

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { BotToken, BotProject } from '@shared/schema';
import { type BotInfo } from './profile/BotProfileEditor';
import { BotProfileSheet } from './profile/BotProfileSheet';
import { BotControlPanel } from './panel/BotControlPanel';
import { BotControlProvider } from './bot-control-context';
import { useBotQueries } from './hooks/use-bot-queries';
import { useBotMutations } from './hooks/use-bot-mutations';
import type { BotStatusResponse } from './bot-types';

/**
 * Свойства компонента управления ботом
 */
interface BotControlProps {
  /** ID проекта */
  projectId: number;
  /** Название проекта */
  projectName: string;
  /** Callback при запуске бота */
  onBotStarted?: (projectId: number, tokenId: number, botName: string) => void;
  /** Callback при остановке бота */
  onBotStopped?: (projectId: number, tokenId: number) => void;
}

/**
 * Основной компонент управления ботами
 */
export function BotControl({ projectId, onBotStarted, onBotStopped }: Omit<BotControlProps, 'projectName'> & { projectName?: string }) {
  const [showAddBot, setShowAddBot] = useState(false);
  const [newBotToken, setNewBotToken] = useState('');
  const [projectForNewBot, setProjectForNewBot] = useState<number | null>(null);

  const [editingField, setEditingField] = useState<{ tokenId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<BotProject | null>(null);
  const [selectedBotInfo, setSelectedBotInfo] = useState<BotInfo | null>(null);

  const [currentElapsedSeconds, setCurrentElapsedSeconds] = useState<Record<number, number>>({});
  /** Ref для хранения статусов без попадания в зависимости useEffect */
  const runningBotsRef = useRef<BotStatusResponse[]>([]);

  const queryClient = useQueryClient();

  const {
    projects,
    projectsLoading,
    allTokens,
    allTokensFlat,
    allBotStatuses,
    allBotInfos,
    refetchStatuses,
  } = useBotQueries();

  const {
    startBotMutation,
    stopBotMutation,
    deleteBotMutation,
    toggleDatabaseMutation,
    createBotMutation,
    parseBotInfoMutation,
    updateBotInfoMutation,
    attachExistingTokenMutation,
    isParsingBot,
  } = useBotMutations({
    projectId,
    allTokensFlat,
    onBotStarted,
    onBotStopped,
    newBotToken,
    projectForNewBot,
    existingTokensCount: allTokensFlat.length,
    allTokensFlatFull: allTokensFlat,
    onBotAdded: () => {
      setShowAddBot(false);
      setNewBotToken('');
      setProjectForNewBot(null);
    },
  });

  // Синхронизируем ref с актуальными статусами
  runningBotsRef.current = allBotStatuses;

  // Таймер для работающих ботов
  useEffect(() => {
    const interval = setInterval(() => {
      const running = runningBotsRef.current.filter(
        s => s?.status === 'running' && s.instance?.startedAt,
      );
      if (running.length === 0) return;

      setCurrentElapsedSeconds(() => {
        const next: Record<number, number> = {};
        running.forEach(bot => {
          if (bot.instance) {
            next[bot.instance.tokenId] = Math.floor(
              (Date.now() - new Date(bot.instance.startedAt).getTime()) / 1000,
            );
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Обновление статусов при возвращении на вкладку
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) refetchStatuses();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refetchStatuses]);

  const handleStartEdit = (tokenId: number, field: string, currentValue: string) => {
    setEditingField({ tokenId, field });
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = () => {
    if (!editingField) return;
    const trimmed = editValue.trim();
    if (trimmed) {
      updateBotInfoMutation.mutate({ tokenId: editingField.tokenId, field: editingField.field, value: trimmed });
    }
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleAddBot = (selectedTokenId?: number | null) => {
    if (!projectForNewBot) return;
    if (selectedTokenId) {
      attachExistingTokenMutation.mutate({ tokenId: selectedTokenId, targetProjectId: projectForNewBot });
    } else {
      if (!newBotToken.trim()) return;
      parseBotInfoMutation.mutate({ token: newBotToken.trim(), projectId: projectForNewBot });
    }
  };

  const getStatusBadge = (token: Pick<BotToken, 'id' | 'isDefault'>) => {
    const status = allBotStatuses.find(s => s.instance?.tokenId === token.id);
    if (status?.status === 'running') {
      return (
        <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Активный
          </div>
        </Badge>
      );
    }
    if (token.isDefault) return (
      <Badge variant="outline" className="border-border text-foreground/80 bg-muted/40">
        По умолчанию
      </Badge>
    );
    return <Badge variant="outline">Готов</Badge>;
  };

  return (
    <BotControlProvider value={{
      allBotStatuses,
      allBotInfos,
      currentElapsedSeconds,
      editingField,
      editValue,
      setEditValue,
      handleStartEdit,
      handleSaveEdit,
      handleCancelEdit,
      getStatusBadge,
      startBotMutation,
      stopBotMutation,
      deleteBotMutation,
      toggleDatabaseMutation,
      setSelectedProject,
      setSelectedBotInfo,
      setIsProfileSheetOpen,
      queryClient,
      setShowAddBot,
      setProjectForNewBot,
      allTokensFlat,
    }}>
      <BotControlPanel
        projectsLoading={projectsLoading}
        projects={projects}
        allTokens={allTokens}
        showAddBot={showAddBot}
        projectForNewBot={projectForNewBot}
        newBotToken={newBotToken}
        setNewBotToken={setNewBotToken}
        isParsingBot={isParsingBot}
        createBotMutation={createBotMutation}
        handleAddBot={handleAddBot}
      />

      <BotProfileSheet
        projectId={selectedProject?.id || 0}
        botInfo={selectedBotInfo}
        onProfileUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/projects/bot/info'] });
        }}
        isOpen={isProfileSheetOpen}
        onClose={() => setIsProfileSheetOpen(false)}
      />
    </BotControlProvider>
  );
}
