/**
 * @fileoverview Строка списка менеджера хранилищ (`StorageConfigRow`).
 * Презентационная строка одного конфига `storage_configs`: бейдж типа
 * (local/S3), имя, индикатор активности и режима только-чтения (Req 11.2),
 * действия «Сделать активным» (Req 11.6) и «Удалить» с подтверждением
 * (Req 11.8 — серверный 409 обрабатывается на уровне менеджера). Стиль
 * бейджа типа хранилища берёт из общего helper'а `panel-styles` (задача 12.1).
 * Только смысловые иконки lucide-react, без декоративных эмодзи (Req 13.2).
 * @module components/editor/files/panel/storage/storage-config-row
 */

import { Star, Lock, Trash2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStorageBadgeStyle } from '../panel-styles';
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
  /** Сделать хранилище активным для новых загрузок (Req 11.6) */
  onSetActive: (configId: string) => void;
  /** Удалить хранилище (Req 11.8) */
  onDelete: (configId: string) => void;
  /** Открыть форму правки конфига (задача 8.3) */
  onEdit?: (configId: string) => void;
  /** Идёт ли изменяющая операция (дизейблит действия) */
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
  /** Стиль бейджа типа хранилища (вариант, иконка, базовые классы) */
  const badgeStyle = getStorageBadgeStyle(storage.backend);
  const TypeIcon = badgeStyle.icon;

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-md border p-3"
      data-testid={`storage-config-row-${storage.configId}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Badge variant={badgeStyle.variant} className={badgeStyle.className}>
          <TypeIcon className={badgeStyle.iconClassName} />
          {storage.backend === 's3' ? 'S3' : 'Локально'}
        </Badge>
        <span className="truncate text-sm font-medium" title={storage.name}>
          {storage.name}
        </span>
        {storage.isActive && (
          <Badge variant="outline" className="gap-1 text-[10px] text-primary" data-testid="storage-active-badge">
            <Star className="h-3 w-3 fill-current" />
            Активно
          </Badge>
        )}
        {storage.readOnly && (
          <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground" data-testid="storage-readonly-badge">
            <Lock className="h-3 w-3" />
            Только чтение
          </Badge>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8"
          disabled={storage.isActive || storage.readOnly || isMutating}
          onClick={() => onSetActive(storage.configId)}
          title={storage.readOnly ? 'Только чтение: нельзя сделать активным' : 'Сделать активным для загрузок'}
          data-testid={`storage-set-active-${storage.configId}`}
        >
          <Star className="mr-1 h-3.5 w-3.5" />
          Активным
        </Button>

        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
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
              className="h-8 w-8 text-destructive hover:text-destructive"
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
