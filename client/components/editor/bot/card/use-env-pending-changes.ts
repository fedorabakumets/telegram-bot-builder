/**
 * @fileoverview Хук для управления несохранёнными изменениями переменных окружения
 * Накапливает изменения и отправляет одним batch-запросом
 * @module components/editor/bot/card/use-env-pending-changes
 */

import { useState, useCallback } from 'react';
import { apiRequest } from '@/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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
 * Отправляет все изменения одним batch-запросом
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Объект с состоянием и методами управления изменениями
 */
export function useEnvPendingChanges(projectId: number, tokenId: number) {
  const [changes, setChanges] = useState<Map<string, PendingChange>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /** URL batch-эндпоинта */
  const batchUrl = `/api/projects/${projectId}/tokens/${tokenId}/env-batch`;

  /** Количество несохранённых изменений */
  const changesCount = changes.size;

  /** Добавить или обновить изменение */
  const addChange = useCallback((change: PendingChange) => {
    setChanges(prev => {
      const next = new Map(prev);
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

  /** Инвалидировать кэши после сохранения */
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens/${tokenId}/env-variables`] });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/admin-ids`] });
  }, [queryClient, projectId, tokenId]);

  /** Сохранить все изменения одним batch-запросом */
  const saveAll = useCallback(async () => {
    setIsSaving(true);
    try {
      const entries = Array.from(changes.values());
      await apiRequest('PUT', batchUrl, { changes: entries });
      setChanges(new Map());
      invalidateAll();
      toast({ title: 'Сохранено', description: `${entries.length} изменений применено` });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message || 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [changes, batchUrl, invalidateAll, toast]);

  /** Сохранить и перезапустить бота */
  const saveAndRestart = useCallback(async () => {
    setIsSaving(true);
    try {
      const entries = Array.from(changes.values());
      await apiRequest('PUT', batchUrl, { changes: entries });
      setChanges(new Map());
      invalidateAll();
      await apiRequest('POST', `/api/projects/${projectId}/bot/start`, { tokenId });
      queryClient.invalidateQueries({ queryKey: [`/api/tokens/${tokenId}/bot-status`] });
      toast({ title: 'Бот перезапущен', description: 'Изменения сохранены, бот перезапущен' });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message || 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [changes, batchUrl, projectId, tokenId, queryClient, invalidateAll, toast]);

  return { changes, changesCount, addChange, discardAll, getPendingValue, saveAll, saveAndRestart, isSaving };
}
