/**
 * @fileoverview Хук состояния открытия формы хранилища (`useStorageFormState`).
 * Owns флаг открытия StorageConfigForm и выбранный для правки configId,
 * резолвит его в DTO из переданного списка конфигов. Вынесено из
 * StorageConfigManager, чтобы тело менеджера осталось в пределах лимита строк.
 * @module components/editor/files/panel/storage/use-storage-form-state
 */

import { useMemo, useState } from 'react';

import type { StorageConfigDto } from '../../hooks/use-storage-configs';

/** Результат хука состояния формы хранилища */
export interface UseStorageFormStateResult {
  /** Открыта ли форма */
  formOpen: boolean;
  /** Управление открытием формы */
  setFormOpen: (open: boolean) => void;
  /** Редактируемый конфиг (DTO) или null для создания */
  editing: StorageConfigDto | null;
  /** Открыть форму создания нового конфига */
  openCreate: () => void;
  /** Открыть форму правки конфига по id */
  openEdit: (configId: string) => void;
}

/**
 * Хук состояния открытия формы создания/правки хранилища.
 * @param configs - Полный список конфигов для резолва редактируемого DTO
 * @returns Состояние открытия формы и обработчики create/edit
 */
export function useStorageFormState(configs: StorageConfigDto[]): UseStorageFormStateResult {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = useMemo(
    () => (editingId ? configs.find((c) => c.id === editingId) ?? null : null),
    [editingId, configs],
  );

  const openCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (configId: string) => {
    setEditingId(configId);
    setFormOpen(true);
  };

  return { formOpen, setFormOpen, editing, openCreate, openEdit };
}
