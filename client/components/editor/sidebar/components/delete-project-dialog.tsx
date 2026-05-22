/**
 * @fileoverview Диалог подтверждения удаления проекта
 * Позволяет сохранить проект как шаблон перед удалением или удалить навсегда
 * @module components/editor/sidebar/components/delete-project-dialog
 */

import React from 'react';
import { Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** Пропсы компонента DeleteProjectDialog */
export interface DeleteProjectDialogProps {
  /** Открыт ли диалог */
  open: boolean;
  /** Колбэк закрытия */
  onOpenChange: (open: boolean) => void;
  /** Название проекта */
  projectName: string;
  /** Данные проекта для сохранения как шаблон */
  projectData: any;
  /** Колбэк удаления проекта */
  onDelete: () => void;
}

/**
 * Сохраняет проект как шаблон в localStorage
 * @param name - Название шаблона
 * @param data - Данные проекта
 */
const saveAsTemplate = (name: string, data: any) => {
  const key = 'saved-templates';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push({ name, data, savedAt: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(existing));
};

/**
 * Диалог подтверждения удаления проекта
 * Предлагает сохранить как шаблон, удалить навсегда или отменить
 * @param props - Свойства компонента
 * @returns JSX элемент диалога
 */
export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectName,
  projectData,
  onDelete,
}: DeleteProjectDialogProps) {
  /** Сохранить как шаблон и удалить */
  const handleSaveAndDelete = () => {
    saveAsTemplate(projectName, projectData);
    onDelete();
    onOpenChange(false);
  };

  /** Удалить навсегда */
  const handleDeleteForever = () => {
    onDelete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl shadow-2xl border-slate-200/60 dark:border-slate-700/60 max-w-md w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Удалить проект?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Проект «{projectName}» будет удалён. Это действие нельзя отменить.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 pt-2 sm:flex-col">
          <Button
            onClick={handleSaveAndDelete}
            className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white gap-2"
          >
            <Save className="h-4 w-4" />
            Сохранить как сценарий и удалить
          </Button>
          <Button variant="destructive" onClick={handleDeleteForever} className="w-full gap-2">
            <Trash2 className="h-4 w-4" />
            Удалить навсегда
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full gap-2">
            <X className="h-4 w-4" />
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
