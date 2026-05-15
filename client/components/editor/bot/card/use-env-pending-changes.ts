/**
 * @fileoverview Хук для управления несохранёнными изменениями переменных окружения
 * Накапливает изменения в локальном состоянии до явного сохранения пользователем
 * @module components/editor/bot/card/use-env-pending-changes
 */

import { useState, useCallback } from 'react';
import { apiRequest } from '@/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useSystemEnvUpdate } from './use-system-env-update';
import { useEnvVariables } from './use-env-variables';

/** Одно несохранённое изменение */
export interface PendingChange {
  /** Действие: обновление, создание или удаление */
  action: 'update' | 'create' | 'delete';
  /** Тип: системная или кастомная */
  type: 'system' | 'custom';
  /** ID переменной (для кастомных update/delete) */
  id?: number;
  /** Ключ переменной */
  key: string;
  /** Новое значение (для update/create) */
  value: string;
  /** Флаг секретности (для create) */
  isSecret?: number;
}

/**
 * Хук для управления dirty state переменных окружения
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Объект с состоянием и методами управления изменениями
 */
export function useEnvPendingChanges(projectId: number, tokenId: number) {
  const [changes, setChanges] = useState<Map<string, PendingChange>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { handleSystemUpdate } = useSystemEnvUpdate(projectId, tokenId);
  const { updateMutation, createMutation, deleteMutation } = useEnvVariables(projectId, tokenId);

  /** Количество несохранённых изменений */
  const changesCount = changes.size;

  /** Добавить или обновить изменение */
  const addChange = useCallback((change: PendingChange) => {
    setChanges(prev => {
      const next = new Map(prev);
      /** Для удаления используем уникальный ключ с префиксом */
      const mapKey = change.action === 'delete' ? `__delete__${change.id}` : change.key;
      next.set(mapKey, change);
      return next;
    });
  }, []);

  /** Сбросить все изменения */
  const discardAll = useCallback(() => {
    setChanges(new Map());
  }, []);

  /** Получить pending значение для ключа */
  const getPendingValue = useCallback((key: string): string | undefined => {
    return changes.get(key)?.value;
  }, [changes]);

  /** Сохранить все изменения на сервер */
  const saveAll = useCallback(async () => {
    setIsSaving(true);
    try {
      const entries = Array.from(changes.values());
      for (const entry of entries) {
        if (entry.action === 'delete' && entry.id) {
          deleteMutation.mutate(entry.id);
        } else if (entry.action === 'create') {
          createMutation.mutate({ key: entry.key, value: entry.value, isSecret: entry.isSecret ?? 0 });
        } else if (entry.action === 'update' && entry.type === 'system') {
          handleSystemUpdate(entry.key, entry.value);
        } else if (entry.action === 'update' && entry.id) {
          updateMutation.mutate({ id: entry.id, value: entry.value });
        }
      }
      setChanges(new Map());
      toast({ title: 'Сохранено', description: `${entries.length} изменений применено` });
    } finally {
      setIsSaving(false);
    }
  }, [changes, handleSystemUpdate, updateMutation, createMutation, deleteMutation, toast]);

  /** Сохранить и перезапустить бота */
  const saveAndRestart = useCallback(async () => {
    await saveAll();
    try {
      await apiRequest('POST', `/api/projects/${projectId}/bot/start`, { tokenId });
      queryClient.invalidateQueries({ queryKey: [`/api/tokens/${tokenId}/bot-status`] });
      toast({ title: 'Бот перезапущен', description: 'Изменения сохранены, бот перезапущен' });
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось перезапустить бота', variant: 'destructive' });
    }
  }, [saveAll, projectId, tokenId, queryClient, toast]);

  return { changes, changesCount, addChange, discardAll, getPendingValue, saveAll, saveAndRestart, isSaving };
}
