/**
 * @fileoverview Хук для управления ID администраторов бота
 *
 * Загружает и сохраняет ADMIN_IDS через API.
 * Конвертирует строку через запятую ↔ массив строк.
 *
 * @module use-admin-ids
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';

/**
 * Результат хука useAdminIds
 */
interface UseAdminIdsResult {
  /** Список ID администраторов */
  ids: string[];
  /** Заменить весь список */
  setIds: (ids: string[]) => void;
  /** Идёт ли сохранение */
  isSaving: boolean;
  /** Только что сохранено (сбрасывается через 2 сек) */
  isSaved: boolean;
  /** Сохранить список через API */
  save: () => Promise<void>;
}

/** Разбить строку через запятую в массив, отфильтровав пустые */
const parseIds = (raw: string): string[] =>
  raw.split(',').map((s) => s.trim()).filter(Boolean);

/** Собрать массив в строку через запятую */
const joinIds = (ids: string[]): string =>
  ids.filter(Boolean).join(',');

/**
 * Хук для чтения и сохранения ADMIN_IDS бота
 *
 * @param projectId - ID проекта бота
 */
export function useAdminIds(projectId: number): UseAdminIdsResult {
  const [ids, setIds] = useState<string[]>(['']);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    apiRequest('GET', `/api/projects/${projectId}/admin-ids`)
      .then((data: { adminIds: string }) => {
        const parsed = parseIds(data.adminIds ?? '');
        setIds(parsed.length ? parsed : ['']);
      })
      .catch(() => setIds(['']));
  }, [projectId]);

  const save = async () => {
    setIsSaving(true);
    try {
      await apiRequest('PUT', `/api/projects/${projectId}/admin-ids`, {
        adminIds: joinIds(ids),
      });
      toast({ title: 'Сохранено', description: 'Список администраторов обновлён' });
      setIsSaved(true);
      // Re-fetch to confirm saved state
      apiRequest('GET', `/api/projects/${projectId}/admin-ids`)
        .then((data: { adminIds: string }) => {
          const parsed = parseIds(data.adminIds ?? '');
          setIds(parsed.length ? parsed : ['']);
        })
        .catch(() => {});
      // Reset saved indicator after 2 seconds
      setTimeout(() => setIsSaved(false), 2000);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить ADMIN_IDS', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return { ids, setIds, isSaving, isSaved, save };
}
