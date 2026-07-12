/**
 * @fileoverview Менеджер конфигов хранилищ (`StorageConfigManager`).
 * @module components/editor/files/panel/storage/storage-config-manager
 */

import { Database, HardDrive, Plus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStorageConfigs } from '../../hooks/use-storage-configs';
import { toStorageInfo } from './storage-info';
import { StorageConfigRow } from './storage-config-row';
import { StorageConfigForm } from './storage-config-form';
import { useStorageManagerActions } from './use-storage-manager-actions';
import { useStorageFormState } from './use-storage-form-state';

/** Пропсы менеджера конфигов хранилищ */
export interface StorageConfigManagerProps {
  /** Открыта ли модалка */
  open: boolean;
  /** Закрытие модалки */
  onOpenChange: (open: boolean) => void;
}

/**
 * Менеджер хранилищ: список + активное + удаление + форма создания/правки.
 * @param props - Состояние открытия модалки менеджера
 * @returns JSX элемент модалки менеджера хранилищ
 */
export function StorageConfigManager({
  open,
  onOpenChange,
}: StorageConfigManagerProps) {
  const { configs, isLoading } = useStorageConfigs();
  const { handleSetActive, handleDelete, isMutating } = useStorageManagerActions();
  const { formOpen, setFormOpen, editing, openCreate, openEdit } = useStorageFormState(configs);
  const storages = configs.map(toStorageInfo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" data-testid="storage-config-manager">
        <DialogHeader className="space-y-0 border-b px-6 pb-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5 pt-0.5">
              <DialogTitle className="text-lg leading-none">Хранилища</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                Выберите активное для новых загрузок или добавьте S3 / локальную папку.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex max-h-[50vh] flex-col gap-1 overflow-auto px-3 py-3">
          {isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Загрузка хранилищ…</p>
          )}

          {!isLoading && storages.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <HardDrive className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Хранилища не настроены</p>
                <p className="text-xs text-muted-foreground">
                  Добавьте локальную папку или S3 для загрузки медиафайлов.
                </p>
              </div>
            </div>
          )}

          {storages.map((storage) => (
            <StorageConfigRow
              key={storage.configId}
              storage={storage}
              onSetActive={handleSetActive}
              onDelete={handleDelete}
              onEdit={openEdit}
              isMutating={isMutating}
            />
          ))}
        </div>

        <div className="border-t px-6 py-4">
          <Button
            type="button"
            size="sm"
            className="h-9 w-full gap-2 sm:w-auto"
            onClick={openCreate}
            title="Добавить новое хранилище"
            data-testid="storage-add-config"
          >
            <Plus className="h-4 w-4" />
            Добавить хранилище
          </Button>
        </div>
      </DialogContent>

      <StorageConfigForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </Dialog>
  );
}
