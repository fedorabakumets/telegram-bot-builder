/**
 * @fileoverview Хук для управления ID администраторов бота
 *
 * Предоставляет функции для чтения и сохранения ADMIN_IDS
 * через API эндпоинт /api/projects/:id/admin-ids
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
  /** Текущее значение поля ввода */
  value: string;
  /** Обновить значение поля */
  setValue: (v: string) => void;
  /** Идёт ли сохранение */
  isSaving: boolean;
  /** Сохранить значение через API */
  save: () => Promise<void>;
}

/**
 * Хук для чтения и сохранения ADMIN_IDS бота
 *
 * @param projectId - ID проекта бота
 */
export function useAdminIds(projectId: number): UseAdminIdsResult {
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    apiRequest('GET', `/api/projects/${projectId}/admin-ids`)
      .then((data: { adminIds: string }) => setValue(data.adminIds ?? ''))
      .catch(() => setValue(''));
  }, [projectId]);

  const save = async () => {
    setIsSaving(true);
    try {
      await apiRequest('PUT', `/api/projects/${projectId}/admin-ids`, { adminIds: value });
      toast({ title: 'Сохранено', description: 'Список администраторов обновлён' });
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить ADMIN_IDS', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return { value, setValue, isSaving, save };
}
