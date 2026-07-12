/**
 * @fileoverview Форма создания/правки конфига хранилища (`StorageConfigForm`).
 * @module components/editor/files/panel/storage/storage-config-form
 */

import { CheckCircle2, Cloud, HardDrive, Pencil, PlugZap, XCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  STORAGE_CONFIG_FORM_SETTING_ROW_CLASS,
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

  const isEdit = Boolean(draft.configId);
  const isS3 = draft.backend === 's3';
  const HeaderIcon = isEdit ? Pencil : isS3 ? Cloud : HardDrive;
  const title = isEdit ? 'Изменить хранилище' : 'Новое хранилище';
  const subtitle = isS3
    ? 'Подключение к S3-совместимому хранилищу (MinIO, AWS и др.)'
    : 'Файлы сохраняются в локальную папку на сервере';

  const handleSave = async () => {
    if (await save()) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" data-testid="storage-config-form">
        <DialogHeader className="space-y-0 border-b px-6 pb-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <HeaderIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5 pt-0.5">
              <DialogTitle className="text-lg leading-none">{title}</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">{subtitle}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-4 overflow-auto px-6 py-4">
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

          <div className={STORAGE_CONFIG_FORM_SETTING_ROW_CLASS}>
            <div className="space-y-0.5">
              <Label htmlFor="storage-readonly" className="text-sm font-medium">
                Только чтение
              </Label>
              <p className="text-xs text-muted-foreground">Загрузка в это хранилище будет недоступна</p>
            </div>
            <Switch
              id="storage-readonly"
              checked={Boolean(draft.readOnly)}
              onCheckedChange={(v) => setField('readOnly', v)}
              data-testid="storage-field-readonly"
            />
          </div>

          {testResult && (
            <div
              className={cn(
                STORAGE_TEST_RESULT_BASE,
                testResult.ok ? STORAGE_TEST_RESULT_OK_CLASS : STORAGE_TEST_RESULT_ERROR_CLASS,
              )}
              data-testid="storage-test-result"
            >
              {testResult.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              <span>
                {testResult.message ?? (testResult.ok ? 'Хранилище доступно' : 'Хранилище недоступно')}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t px-6 py-4 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={runTest}
            disabled={isTesting || !isEdit}
            title={isEdit ? 'Проверить доступность' : 'Доступно после сохранения'}
            data-testid="storage-test-button"
          >
            <PlugZap className="h-4 w-4" />
            {isTesting ? 'Проверка…' : 'Проверить'}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving} data-testid="storage-save-button">
              {isSaving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
