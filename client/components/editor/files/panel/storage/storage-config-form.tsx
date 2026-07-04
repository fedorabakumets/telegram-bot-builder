/**
 * @fileoverview Форма создания/правки конфига хранилища (`StorageConfigForm`).
 * shadcn-модалка с общими полями (имя, тип бэкенда, только-чтение), группами
 * полей local/S3 (через StorageConfigFormFields), кнопкой «Проверить»
 * доступность (Req 11.3) и сохранением create/update с surfacing 400-
 * диагностики (Req 11.9). Креды S3 вводятся только при создании/смене (Req 11.4).
 * Логика — в useStorageConfigForm; здесь — разметка. Иконки lucide-react (Req 13.2).
 * @module components/editor/files/panel/storage/storage-config-form
 */

import { CheckCircle2, XCircle, PlugZap } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/utils';
import type { StorageConfigDto } from '../../hooks/use-storage-configs';
import type { StorageBackendKind } from './storage-info';
import {
  STORAGE_TEST_RESULT_BASE,
  STORAGE_TEST_RESULT_ERROR_CLASS,
  STORAGE_TEST_RESULT_OK_CLASS,
} from '../panel-styles';
import { StorageConfigFormFields } from './storage-config-form-fields';
import { useStorageConfigForm } from './use-storage-config-form';

/** Пропсы формы конфига хранилища */
export interface StorageConfigFormProps {
  /** Открыта ли форма */
  open: boolean;
  /** Закрытие формы */
  onOpenChange: (open: boolean) => void;
  /** Редактируемый конфиг (DTO) или null для создания */
  editing: StorageConfigDto | null;
}

/**
 * Форма создания/правки хранилища (local-папка или S3).
 * @param props - Состояние открытия и редактируемый конфиг
 * @returns JSX элемент модальной формы
 */
export function StorageConfigForm({ open, onOpenChange, editing }: StorageConfigFormProps) {
  const { draft, setField, setConfig, testResult, isTesting, runTest, save, isSaving } =
    useStorageConfigForm(editing);

  /** Режим правки (id уже есть) — тип бэкенда не меняется */
  const isEdit = Boolean(draft.configId);

  /** Сохранить и закрыть форму при успехе */
  const handleSave = async () => {
    if (await save()) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="storage-config-form">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Изменить хранилище' : 'Новое хранилище'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="storage-name">Имя</Label>
              <Input
                id="storage-name"
                value={draft.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Моё хранилище"
                data-testid="storage-field-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storage-backend">Тип</Label>
              <Select
                value={draft.backend}
                onValueChange={(v) => setField('backend', v as StorageBackendKind)}
                disabled={isEdit}
              >
                <SelectTrigger id="storage-backend" data-testid="storage-field-backend">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Локальная папка</SelectItem>
                  <SelectItem value="s3">S3 (MinIO/AWS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <StorageConfigFormFields
            draft={draft}
            hasSecrets={Boolean(editing?.hasSecrets)}
            onConfigChange={setConfig}
            onCredChange={(key, value) => setField(key, value)}
          />

          <div className="flex items-center gap-2">
            <Switch
              id="storage-readonly"
              checked={Boolean(draft.readOnly)}
              onCheckedChange={(v) => setField('readOnly', v)}
              data-testid="storage-field-readonly"
            />
            <Label htmlFor="storage-readonly">Только чтение</Label>
          </div>

          {testResult && (
            <div
              className={cn(
                STORAGE_TEST_RESULT_BASE,
                testResult.ok ? STORAGE_TEST_RESULT_OK_CLASS : STORAGE_TEST_RESULT_ERROR_CLASS,
              )}
              data-testid="storage-test-result"
            >
              {testResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>{testResult.message ?? (testResult.ok ? 'Хранилище доступно' : 'Хранилище недоступно')}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={runTest}
            disabled={isTesting || !isEdit}
            title={isEdit ? 'Проверить доступность' : 'Доступно после сохранения'}
            data-testid="storage-test-button"
          >
            <PlugZap className="mr-1.5 h-4 w-4" />
            {isTesting ? 'Проверка…' : 'Проверить'}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving} data-testid="storage-save-button">
            {isSaving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
