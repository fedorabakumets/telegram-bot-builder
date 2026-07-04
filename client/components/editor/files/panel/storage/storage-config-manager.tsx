/**
 * @fileoverview Менеджер конфигов хранилищ (`StorageConfigManager`, компонент 10).
 * Самодостаточная shadcn-модалка: показывает список всех `storage_configs`
 * (тип, имя, активность, только-чтение — Req 11.2), позволяет пометить
 * хранилище активным (Req 11.6) и удалить (Req 11.8 — серверный 409
 * «есть файлы» дружелюбно показывается тостом). Данные берутся из хука
 * useStorageConfigs, действия — из useStorageManagerActions (self-contained).
 * Доступен из шапки панели (Req 11.1). Создание/правка local-папки и S3
 * (ввод кредов + тест доступности) — через StorageConfigForm (задача 8.3),
 * состояние открытия — в useStorageFormState. Только смысловые иконки
 * lucide-react, без эмодзи (Req 13.2).
 * @module components/editor/files/panel/storage/storage-config-manager
 */

import { Plus, HardDrive } from 'lucide-react';

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

  /** Хранилища для отображения (нормализованные StorageInfo) */
  const storages = configs.map(toStorageInfo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="storage-config-manager">
        <DialogHeader>
          <DialogTitle>Хранилища</DialogTitle>
          <DialogDescription>
            Список всех хранилищ проекта. Отметьте активное для новых загрузок или удалите ненужное.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[55vh] flex-col gap-2 overflow-auto py-1">
          {isLoading && (
            <p className="py-6 text-center text-sm text-muted-foreground">Загрузка хранилищ…</p>
          )}

          {!isLoading && storages.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <HardDrive className="h-6 w-6" />
              <span>Хранилища не настроены</span>
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

        <div className="flex justify-end border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openCreate}
            title="Добавить новое хранилище"
            data-testid="storage-add-config"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Добавить хранилище
          </Button>
        </div>
      </DialogContent>

      <StorageConfigForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </Dialog>
  );
}
