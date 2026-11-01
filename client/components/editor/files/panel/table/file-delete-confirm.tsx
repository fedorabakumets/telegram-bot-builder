/** @fileoverview Подтверждение удаления отдельного файла из карточки или таблицы. */
import type { ReactNode } from 'react';
import { File, Trash2, X } from 'lucide-react';
import './file-delete-confirm.css';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

/** Свойства подтверждения удаления. */
interface FileDeleteConfirmProps {
  /** Идентификатор удаляемого файла. */
  id: number;
  /** Отображаемое имя файла. */
  name: string;
  /** Удаление после явного подтверждения. */
  onDelete: (id: number) => void;
  /** Кнопка открытия диалога. */
  children: ReactNode;
}

/**
 * Запрашивает подтверждение до вызова удаления файла.
 * @param props - Файл, обработчик и кнопка
 * @returns Диалог с отменой и подтверждением
 */
export function FileDeleteConfirm({ id, name, onDelete, children }: FileDeleteConfirmProps) {
  return <AlertDialog>
    <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
    <AlertDialogContent className="files-delete-dialog">
      {/* Закрытие через крестик равнозначно отмене удаления. */}
      <AlertDialogCancel className="files-delete-close" aria-label="Закрыть окно удаления"><X className="h-4 w-4" aria-hidden="true" /></AlertDialogCancel>
      <AlertDialogHeader>
        <AlertDialogTitle className="text-xl leading-7">Удалить файл?</AlertDialogTitle>
        <AlertDialogDescription>Файл будет удалён. Восстановить его не получится.</AlertDialogDescription>
      </AlertDialogHeader>
      <div className="files-delete-target"><File className="h-5 w-5 shrink-0" aria-hidden="true" /><span>{name}</span></div>
      <AlertDialogFooter>
        <AlertDialogCancel>Отмена</AlertDialogCancel>
        <AlertDialogAction onClick={() => onDelete(id)} data-testid="confirm-delete-file"><Trash2 className="h-4 w-4" aria-hidden="true" />Удалить файл</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
