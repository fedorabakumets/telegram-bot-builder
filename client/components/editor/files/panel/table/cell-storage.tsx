/**
 * @fileoverview Ячейка «хранилище» таблицы файлов (`CellStorage`).
 * Показывает бейдж хранилища: имя S3-конфига из `storage_configs`
 * (`file.storageName`) либо тип бэкенда (`local`/`s3`) как фолбэк (Req 7.6).
 * Стили бейджа берёт из общего helper'а `panel-styles` (Req 13.1 — задача 12.1):
 * вариант, иконка и базовые классы — единый источник для всех мест, где
 * рендерится бейдж хранилища (таблица, карточка, селектор цели, менеджер).
 * @module components/editor/files/panel/table/cell-storage
 */

import { cn } from '@/utils/utils';
import type { ProjectFile } from '../../hooks/use-project-files';
import {
  getStorageBadgeStyle,
} from '../panel-styles';

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
  /** Текст бейджа: имя конфига → тип бэкенда → «local» */
  const label = file.storageName ?? file.storageBackend ?? 'local';
  const style = getStorageBadgeStyle(file.storageBackend);
  const Icon = style.icon;

  return (
    <td className={cn('p-2 align-middle', className)}>
      {/* Подпись без внутренних отступов бейджа совпадает с началом заголовка и не обрезается. */}
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground" title={label}>
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    </td>
  );
}
