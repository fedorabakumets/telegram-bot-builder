/**
 * @fileoverview Хук для работы с переменными окружения токена бота
 * Предоставляет CRUD операции и reveal для секретных значений
 * @module components/editor/bot/card/use-env-variables
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { BotEnvVariable } from '@shared/schema';

/** Ответ API со списком переменных */
interface EnvVariablesResponse {
  /** Массив переменных */
  items: BotEnvVariable[];
  /** Количество переменных */
  count: number;
}

/** Данные для создания переменной */
interface CreateEnvVarInput {
  /** Имя переменной */
  key: string;
  /** Значение переменной */
  value: string;
  /** Флаг секретности (0 или 1) */
  isSecret: number;
}

/** Данные для обновления переменной */
interface UpdateEnvVarInput {
  /** ID переменной */
  id: number;
  /** Новое имя */
  key?: string;
  /** Новое значение */
  value?: string;
  /** Новый флаг секретности */
  isSecret?: number;
}

/**
 * Хук для работы с переменными окружения токена
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Объект с данными и мутациями
 */
export function useEnvVariables(projectId: number, tokenId: number) {
  const queryClient = useQueryClient();
  const baseUrl = `/api/projects/${projectId}/tokens/${tokenId}/env-variables`;
  const queryKey = [baseUrl];

  /** Получение списка переменных */
  const query = useQuery<EnvVariablesResponse>({
    queryKey,
    queryFn: () => apiRequest('GET', baseUrl),
  });

  /** Создание переменной */
  const createMutation = useMutation({
    mutationFn: (data: CreateEnvVarInput) => apiRequest('POST', baseUrl, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  /** Обновление переменной */
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: UpdateEnvVarInput) =>
      apiRequest('PUT', `${baseUrl}/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  /** Удаление переменной */
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `${baseUrl}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  /**
   * Раскрытие секретного значения переменной
   * @param id - ID переменной
   * @returns Реальное значение
   */
  async function revealValue(id: number): Promise<string> {
    const res = await apiRequest('GET', `${baseUrl}/${id}/reveal`);
    return res.value;
  }

  return {
    items: query.data?.items ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    revealValue,
  };
}
