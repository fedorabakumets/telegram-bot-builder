/**
 * @fileoverview Ячейка «хранилище» таблицы файлов (`CellStorage`).
 * Показывает бейдж хранилища: имя S3-конфига из `storage_configs`
 * (`file.storageName`) либо тип бэкенда (`local`/`s3`) как фолбэк (Req 7.6).
 * Для S3 используется выделенный вариант бейджа, для локального — нейтральный.
 * @module components/editor/files/panel/table/cell-storage
 */

import { HardDrive, Cloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';
import type { ProjectFile } from '../../hooks/use-project-files';

/** Пропсы ячейки хранилища */
export interface CellStorageProps {
  /** Данные файла */
  file: ProjectFile;
  /** Дополнительные классы для `td` */
  className?: string;
}

/**
 * Ячейка с бейджем хранилища (local / имя S3-конфига).
 * @param props - Свойства ячейки
 * @returns JSX элемент `<td>` со столбцом «хранилище»
 */
export function CellStorage({ file, className }: CellStorageProps) {
  /** Является ли файл S3-объектом (для иконки/варианта бейджа) */
  const isS3 = file.storageBackend === 's3';
  /** Текст бейджа: имя конфига → тип бэкенда → «local» */
  const label = file.storageName ?? file.storageBackend ?? 'local';
  const Icon = isS3 ? Cloud : HardDrive;

  return (
    <td className={cn('p-2', className)}>
      <Badge variant={isS3 ? 'default' : 'secondary'} className="text-[10px] gap-1" title={label}>
        <Icon className="h-3 w-3" />
        <span className="truncate max-w-[80px]">{label}</span>
      </Badge>
    </td>
  );
}
