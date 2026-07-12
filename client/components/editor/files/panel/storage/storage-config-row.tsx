/**
 * @fileoverview Строка списка менеджера хранилищ (`StorageConfigRow`).
 * @module components/editor/files/panel/storage/storage-config-row
 */

import { Star, Lock, Trash2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import { getStorageBadgeStyle } from '../panel-styles';
import {
  STORAGE_CONFIG_ROW_ACTIVE_CLASS,
  STORAGE_CONFIG_ROW_BASE_CLASS,
  STORAGE_CONFIG_ROW_ICON_CLASS,
  STORAGE_CONFIG_ROW_IDLE_CLASS,
} from '../panel-styles';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { StorageInfo } from './storage-info';

/** Пропсы строки конфига хранилища */
export interface StorageConfigRowProps {
  /** Данные хранилища для отображения */
  storage: StorageInfo;
  /** Сделать хранилище активным для новых загрузок */
  onSetActive: (configId: string) => void;
  /** Удалить хранилище */
  onDelete: (configId: string) => void;
  /** Открыть форму правки конфига */
  onEdit?: (configId: string) => void;
  /** Идёт ли изменяющая операция */
  isMutating?: boolean;
}

/**
 * Строка одного хранилища в менеджере конфигов.
 * @param props - Данные хранилища и колбэки действий
 * @returns JSX элемент строки списка хранилищ
 */
export function StorageConfigRow({
  storage,
  onSetActive,
  onDelete,
  onEdit,
  isMutating = false,
}: StorageConfigRowProps) {
  const badgeStyle = getStorageBadgeStyle(storage.backend);
  const TypeIcon = badgeStyle.icon;
  const backendLabel = storage.backend === 's3' ? 'S3' : 'Локальное хранилище';

  return (
    <div
      className={cn(
        STORAGE_CONFIG_ROW_BASE_CLASS,
        storage.isActive ? STORAGE_CONFIG_ROW_ACTIVE_CLASS : STORAGE_CONFIG_ROW_IDLE_CLASS,
      )}
      data-testid={`storage-config-row-${storage.configId}`}
    >
      <div className={STORAGE_CONFIG_ROW_ICON_CLASS}>
        <TypeIcon className="h-4 w-4 text-primary" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium" title={storage.name}>
            {storage.name}
          </span>
          {storage.isActive && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary"
              data-testid="storage-active-badge"
            >
              <Star className="h-3 w-3 fill-current" />
              Активно
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {backendLabel}
          {storage.readOnly && (
            <>
              <span className="mx-1 text-border/70">·</span>
              <Lock className="mr-0.5 inline h-3 w-3 align-[-2px]" />
              Только чтение
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {!storage.isActive && !storage.readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            disabled={isMutating}
            onClick={() => onSetActive(storage.configId)}
            title="Сделать активным для загрузок"
            data-testid={`storage-set-active-${storage.configId}`}
          >
            <Star className="h-4 w-4" />
          </Button>
        )}

        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            disabled={isMutating}
            onClick={() => onEdit(storage.configId)}
            title="Изменить хранилище"
            data-testid={`storage-edit-${storage.configId}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              disabled={isMutating}
              title="Удалить хранилище"
              data-testid={`storage-delete-${storage.configId}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить хранилище «{storage.name}»?</AlertDialogTitle>
              <AlertDialogDescription>
                Удаление запрещено, если на хранилище есть файлы. Действие необратимо.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(storage.configId)}
                data-testid={`storage-confirm-delete-${storage.configId}`}
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
