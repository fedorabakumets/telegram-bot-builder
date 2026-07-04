/**
 * @fileoverview Презентационный селектор целевого хранилища при загрузке
 * (`StorageTargetSelector`, компонент 9 дизайна). Выпадающий список (shadcn
 * Select) доступных для записи хранилищ (`listWritable` — не readOnly),
 * по умолчанию выбрано активное. Каждый пункт — бейдж с типом (local/S3)
 * и именем. При выборе цели файл сохраняется именно туда (Req 11.7).
 * Стиль бейджа берётся из общего helper'а `panel-styles` (задача 12.1).
 * Только смысловые иконки lucide-react, без эмодзи (Req 13.2).
 * @module components/editor/files/panel/storage/storage-target-selector
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  getStorageBadgeStyle,
  STORAGE_BADGE_LABEL_WIDE,
} from '../panel-styles';
import { listWritable, type StorageInfo } from './storage-info';

/** Пропсы селектора целевого хранилища при загрузке */
export interface StorageTargetSelectorProps {
  /** Доступные хранилища (фильтруются до доступных для записи) */
  storages: StorageInfo[];
  /** Выбранный configId цели загрузки */
  value: string;
  /** Смена цели */
  onChange: (configId: string) => void;
  /** Заблокировать селектор (например, во время загрузки) */
  disabled?: boolean;
}

/**
 * Бейдж типа хранилища (local/S3) с именем — для пункта списка и значения.
 * Стили берутся из единого helper'а `panel-styles` (Req 13.1).
 * @param props - Хранилище для отображения
 * @returns JSX элемент с иконкой типа и именем
 */
function StorageBadge({ storage }: { storage: StorageInfo }) {
  const style = getStorageBadgeStyle(storage.backend);
  const Icon = style.icon;
  return (
    <Badge variant={style.variant} className={style.className} title={storage.name}>
      <Icon className={style.iconClassName} />
      <span className={STORAGE_BADGE_LABEL_WIDE}>{storage.name}</span>
    </Badge>
  );
}

/**
 * Селектор целевого хранилища для загрузки файла.
 * @param props - Свойства селектора (список, значение, обработчик смены)
 * @returns JSX элемент выпадающего списка хранилищ
 */
export function StorageTargetSelector({
  storages,
  value,
  onChange,
  disabled,
}: StorageTargetSelectorProps) {
  /** Только доступные для записи хранилища (эквивалент listWritable) */
  const writable = listWritable(storages);

  // Нет доступных для записи хранилищ — селектор скрывается.
  if (writable.length === 0) return null;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 w-auto min-w-[160px]" data-testid="storage-target-selector">
        <SelectValue placeholder="Хранилище" />
      </SelectTrigger>
      <SelectContent>
        {writable.map((storage) => (
          <SelectItem
            key={storage.configId}
            value={storage.configId}
            data-testid={`storage-target-option-${storage.configId}`}
          >
            <StorageBadge storage={storage} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
