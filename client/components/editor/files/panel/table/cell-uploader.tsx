/**
 * @fileoverview Ячейка «сотрудник» таблицы файлов (`CellUploader`).
 * Сопоставляет `file.uploadedBy` со списком коллабораторов и показывает
 * аватар загрузившего сотрудника (Req 9.3). Если `uploadedBy` пуст или
 * коллаборатор не найден (удалён), отображается заглушка «—» (Req 9.4).
 * Использует shadcn Avatar с фолбэком по инициалам имени.
 * @module components/editor/files/panel/table/cell-uploader
 */

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/utils/utils';
import type { ProjectFile } from '../../hooks/use-project-files';
import type { CollaboratorInfo } from '../../hooks/use-project-collaborators';

/** Пропсы ячейки сотрудника */
export interface CellUploaderProps {
  /** Данные файла */
  file: ProjectFile;
  /** Коллабораторы проекта (для сопоставления uploadedBy) */
  collaborators: CollaboratorInfo[];
  /** Дополнительные классы для `td` */
  className?: string;
}

/**
 * Возвращает инициалы из имени коллаборатора (1–2 символа).
 * @param name - Отображаемое имя
 * @returns Инициалы в верхнем регистре
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Ячейка с аватаром загрузившего сотрудника.
 * @param props - Свойства ячейки
 * @returns JSX элемент `<td>` со столбцом «сотрудник»
 */
export function CellUploader({ file, collaborators, className }: CellUploaderProps) {
  /** Коллаборатор-загрузчик по uploadedBy (может отсутствовать — Req 9.4) */
  const uploader = file.uploadedBy != null
    ? collaborators.find((c) => c.userId === file.uploadedBy)
    : undefined;

  return (
    <td className={cn('p-2 text-center', className)}>
      {uploader ? (
        <div className="flex items-center justify-center" title={uploader.name}>
          <Avatar className="h-6 w-6">
            {uploader.photoUrl ? <AvatarImage src={uploader.photoUrl} alt={uploader.name} /> : null}
            <AvatarFallback className="text-[9px]">{getInitials(uploader.name)}</AvatarFallback>
          </Avatar>
        </div>
      ) : (
        <span className="text-muted-foreground text-[10px]">—</span>
      )}
    </td>
  );
}
