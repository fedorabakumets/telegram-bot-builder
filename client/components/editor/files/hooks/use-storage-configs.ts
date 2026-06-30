/**
 * @fileoverview React Query хук реестра хранилищ `/api/storage-configs`.
 * Отдаёт список конфигов (без секретов) и мутации создания/обновления/
 * удаления/проверки/активации с инвалидацией списка (Req 11.2, 11.3).
 * Сами вызовы API вынесены в storage-configs-api; здесь — кэш и мутации.
 * @module components/editor/files/hooks/use-storage-configs
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  STORAGE_CONFIGS_URL,
  fetchStorageConfigs,
  createStorageConfig,
  updateStorageConfig,
  deleteStorageConfig,
  testStorageConfig,
  type StorageConfigDto,
  type CreateStorageConfigInput,
  type UpdateStorageConfigInput,
  type StorageTestResult,
} from './storage-configs-api';

export type {
  StorageConfigDto,
  CreateStorageConfigInput,
  UpdateStorageConfigInput,
  StorageTestResult,
} from './storage-configs-api';

/** Ключ React Query для списка конфигов хранилищ */
const STORAGE_CONFIGS_KEY = [STORAGE_CONFIGS_URL] as const;

/** Аргументы обновления конфига хранилища */
export interface UpdateStorageConfigArgs {
  /** Идентификатор обновляемого конфига */
  id: string;
  /** Частичные поля обновления */
  input: UpdateStorageConfigInput;
}

/** Результат хука реестра хранилищ */
export interface UseStorageConfigsResult {
  /** Список конфигов хранилищ (без секретов) */
  configs: StorageConfigDto[];
  /** Идёт ли загрузка списка */
  isLoading: boolean;
  /** Создать новый конфиг хранилища */
  create: (input: CreateStorageConfigInput) => Promise<StorageConfigDto>;
  /** Обновить конфиг хранилища по id */
  update: (args: UpdateStorageConfigArgs) => Promise<StorageConfigDto>;
  /** Удалить конфиг хранилища по id */
  remove: (id: string) => Promise<{ ok: boolean; id: string }>;
  /** Проверить доступность конфига по id */
  test: (id: string) => Promise<StorageTestResult>;
  /** Пометить конфиг активным для новых загрузок */
  setActive: (id: string) => Promise<StorageConfigDto>;
  /** Выполняется ли любая мутация реестра */
  isMutating: boolean;
}

/**
 * Хук для работы с реестром хранилищ: список + CRUD/тест/активация.
 * Все изменяющие операции инвалидируют список, чтобы UI отражал актуальное
 * состояние (активность, наличие секретов, режим только-чтения).
 * @returns Список конфигов, состояние загрузки и набор мутаций
 */
export function useStorageConfigs(): UseStorageConfigsResult {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<StorageConfigDto[]>({
    queryKey: STORAGE_CONFIGS_KEY,
    queryFn: fetchStorageConfigs,
    staleTime: 15000,
  });

  /** Инвалидация списка конфигов после изменяющей операции */
  const invalidate = () => queryClient.invalidateQueries({ queryKey: STORAGE_CONFIGS_KEY });

  const createMutation = useMutation({
    mutationFn: (input: CreateStorageConfigInput) => createStorageConfig(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: UpdateStorageConfigArgs) => updateStorageConfig(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStorageConfig(id),
    onSuccess: invalidate,
  });

  // Активация — частный случай обновления (isActive=true), также инвалидирует список.
  const setActiveMutation = useMutation({
    mutationFn: (id: string) => updateStorageConfig(id, { isActive: true }),
    onSuccess: invalidate,
  });

  return {
    configs: data ?? [],
    isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    test: testStorageConfig,
    setActive: setActiveMutation.mutateAsync,
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      setActiveMutation.isPending,
  };
}
