/**
 * @fileoverview Хук состояния формы конфига хранилища (`useStorageConfigForm`).
 * Owns черновик создания/правки, обработчики изменения полей, сохранение
 * (create/update) с surfacing 400-диагностики (Req 11.9) и проверку
 * доступности существующего конфига (Req 11.3). Креды S3 принимаются только
 * при создании/смене (Req 11.4). Вынесено из StorageConfigForm ради лимита строк.
 * @module components/editor/files/panel/storage/use-storage-config-form
 */

import { useEffect, useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import {
  useStorageConfigs,
  type StorageConfigDto,
  type StorageTestResult,
} from '../../hooks/use-storage-configs';
import {
  draftFromDto,
  emptyDraft,
  extractSaveError,
  toCreateInput,
  toUpdateInput,
  validateDraft,
  type StorageConfigDraft,
} from './storage-config-draft';

/** Результат хука формы конфига хранилища */
export interface UseStorageConfigFormResult {
  /** Текущий черновик */
  draft: StorageConfigDraft;
  /** Изменить произвольное поле черновика */
  setField: <K extends keyof StorageConfigDraft>(key: K, value: StorageConfigDraft[K]) => void;
  /** Изменить несекретное поле config */
  setConfig: (key: string, value: unknown) => void;
  /** Результат последней проверки доступности */
  testResult: StorageTestResult | null;
  /** Идёт ли проверка доступности */
  isTesting: boolean;
  /** Проверить доступность существующего конфига */
  runTest: () => Promise<void>;
  /** Сохранить (create/update); true при успехе */
  save: () => Promise<boolean>;
  /** Идёт ли сохранение */
  isSaving: boolean;
}

/**
 * Хук формы хранилища: черновик, изменения, сохранение и тест.
 * @param editing - Редактируемый конфиг (DTO) или null для создания
 * @returns Состояние и обработчики формы
 */
export function useStorageConfigForm(editing: StorageConfigDto | null): UseStorageConfigFormResult {
  const { create, update, test } = useStorageConfigs();
  const { toast } = useToast();
  const [draft, setDraft] = useState<StorageConfigDraft>(() =>
    editing ? draftFromDto(editing) : emptyDraft(),
  );
  const [testResult, setTestResult] = useState<StorageTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Пересобираем черновик при смене редактируемого конфига / открытии формы.
  useEffect(() => {
    setDraft(editing ? draftFromDto(editing) : emptyDraft());
    setTestResult(null);
  }, [editing]);

  const setField: UseStorageConfigFormResult['setField'] = (key, value) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const setConfig = (key: string, value: unknown) =>
    setDraft((prev) => ({ ...prev, config: { ...prev.config, [key]: value } }));

  const runTest = async () => {
    if (!draft.configId) {
      toast({ title: 'Сначала сохраните хранилище', description: 'Проверка доступна для сохранённых конфигов' });
      return;
    }
    setIsTesting(true);
    try {
      const result = await test(draft.configId);
      setTestResult(result);
    } catch (error) {
      setTestResult({ ok: false, message: extractSaveError(error) });
    } finally {
      setIsTesting(false);
    }
  };

  const save = async (): Promise<boolean> => {
    const validationError = validateDraft(draft);
    if (validationError) {
      toast({ variant: 'destructive', title: 'Проверьте поля', description: validationError });
      return false;
    }
    setIsSaving(true);
    try {
      if (draft.configId) {
        await update({ id: draft.configId, input: toUpdateInput(draft) });
      } else {
        await create(toCreateInput(draft));
      }
      toast({ title: draft.configId ? 'Хранилище обновлено' : 'Хранилище создано' });
      return true;
    } catch (error) {
      // Req 11.9: 400 с диагностикой (например, провал проверки S3 при сохранении).
      toast({ variant: 'destructive', title: 'Не удалось сохранить', description: extractSaveError(error) });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { draft, setField, setConfig, testResult, isTesting, runTest, save, isSaving };
}
