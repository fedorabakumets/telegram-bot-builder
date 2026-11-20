/**
 * @fileoverview Bulk-кнопки проекта: перезапуск и запуск офлайн
 * @module ProjectBotBulkActions
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Play, RotateCw } from 'lucide-react';
import {
  startOfflineProgressQueryKey,
  type StartOfflineProgressCache,
} from '../start-offline-progress-query';
import { StartOfflineConfirmDialog } from './StartOfflineConfirmDialog';

/** Свойства bulk-действий проекта */
export interface ProjectBotBulkActionsProps {
  /** ID проекта */
  projectId: number;
  /** Название проекта (для диалога) */
  projectName: string;
  /** Число ботов (0 — кнопки скрыты) */
  botsCount: number;
  /** Перезапуск running */
  onRestartAll?: () => void;
  /** Идёт перезапуск */
  isRestartingAll?: boolean;
  /** Число офлайн-ботов */
  offlineCount?: number;
  /** Запуск офлайн */
  onStartOfflineAll?: () => void;
  /** Идёт массовый старт офлайн */
  isStartingOffline?: boolean;
  /** Делегирует видимость подписей общей адаптивной шапке. */
  adaptiveLabels?: boolean;
}

/**
 * Кнопки «Перезапустить» / «Запустить офлайн» для проекта
 * @param props - Свойства
 * @returns JSX или null
 */
export function ProjectBotBulkActions({
  projectId,
  projectName,
  botsCount,
  onRestartAll,
  isRestartingAll,
  offlineCount = 0,
  onStartOfflineAll,
  isStartingOffline,
  adaptiveLabels = false,
}: ProjectBotBulkActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: progress } = useQuery<StartOfflineProgressCache | undefined>({
    queryKey: startOfflineProgressQueryKey(projectId),
    queryFn: () => undefined,
    enabled: false,
    staleTime: Infinity,
  });

  if (botsCount <= 0) return null;

  const progressLabel =
    isStartingOffline && progress && progress.status === 'running' && progress.total > 0
      ? `${progress.started + progress.failed}/${progress.total}`
      : null;

  /** В шапке краткая подпись освобождает место, полное действие указано в доступном имени. */
  const startLabel = adaptiveLabels ? 'Запустить' : 'Запустить офлайн';
  return (
    <>
      <div className={adaptiveLabels ? 'flex shrink-0 items-center gap-0.5' : 'flex shrink-0 items-center gap-1 sm:gap-1.5'}>
        <Button
          variant="ghost"
          size="sm"
          className={adaptiveLabels ? 'h-8 min-w-8 gap-1.5 px-2 text-xs text-muted-foreground' : 'h-7 px-1.5 text-xs text-muted-foreground sm:px-2'}
          onClick={onRestartAll}
          disabled={isRestartingAll || isStartingOffline}
          aria-label="Перезапустить всех запущенных ботов проекта"
        >
          {/* Стрелка по часовой отличает перезапуск от обновления данных. */}
          <RotateCw className={`h-3 w-3 ${adaptiveLabels ? '' : 'sm:mr-1'} ${isRestartingAll ? 'motion-safe:animate-spin' : ''}`} />
          {/* Подпись можно скрыть в компактной шапке; у кнопки есть доступное имя. */}
          {/* Подписи запуска и перезапуска оцениваются отдельно. */}
          <span data-workspace-label={adaptiveLabels ? 'bulk-restart' : undefined} className={adaptiveLabels ? undefined : 'hidden sm:inline'}>
            {isRestartingAll ? 'Перезапуск...' : 'Перезапустить'}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={adaptiveLabels ? 'h-8 min-w-8 gap-1.5 px-2 text-xs text-muted-foreground' : 'h-7 px-1.5 text-xs text-muted-foreground sm:px-2'}
          onClick={() => setConfirmOpen(true)}
          disabled={offlineCount === 0 || isStartingOffline || isRestartingAll}
          aria-label="Запустить офлайн-ботов проекта"
        >
          <Play className={`h-3 w-3 ${adaptiveLabels ? '' : 'sm:mr-1'} ${isStartingOffline ? 'animate-pulse' : ''}`} />
          <span data-workspace-label={adaptiveLabels ? 'bulk-start' : undefined} className={adaptiveLabels ? undefined : 'hidden sm:inline'}>
            {isStartingOffline
              ? (progressLabel ? `Запуск ${progressLabel}` : 'Запуск...')
              : offlineCount > 0
                ? `${startLabel} (${offlineCount})`
                : startLabel}
          </span>
        </Button>
      </div>

      <StartOfflineConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        projectName={projectName}
        offlineCount={offlineCount}
        onConfirm={() => onStartOfflineAll?.()}
      />
    </>
  );
}
