/**
 * @fileoverview Диалог подтверждения удаления сценария на основе AlertDialog из shadcn/ui
 * @module client/components/editor/scenariy/components/TemplateDeleteDialog
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { TemplateDeleteDialogProps } from '../types/scenariy-tipy';

/**
 * Диалог подтверждения удаления сценария
 * Заменяет window.confirm — использует AlertDialog из shadcn/ui
 * @param props - свойства компонента
 * @returns JSX элемент диалога
 */
export function TemplateDeleteDialog({ template, onConfirm, onCancel }: TemplateDeleteDialogProps) {
  return (
    <AlertDialog open={template !== null} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить сценарий?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить сценарий{' '}
            <span className="font-semibold text-foreground">«{template?.name}»</span>?
            Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
