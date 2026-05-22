/**
 * @fileoverview Диалог подтверждения удаления проекта
 * Позволяет сохранить проект как шаблон перед удалением или удалить навсегда
 * @module components/editor/sidebar/components/delete-project-dialog
 */

import React, { useState } from 'react';
import { Save, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  /** Сохранить как сценарий через API и удалить */
  const handleSaveAndDelete = async () => {
    setIsSaving(true);
    try {
      await apiRequest('POST', '/api/templates', {
        name: projectName,
        description: `Сохранено перед удалением`,
        category: 'custom',
        tags: [],
        isPublic: 0,
        difficulty: 'easy',
        language: 'ru',
        requiresToken: 1,
        complexity: 1,
        estimatedTime: 5,
        featured: 0,
        data: projectData,
      });
      toast({ title: '✅ Сценарий сохранён', description: `"${projectName}" сохранён в ваши сценарии` });
      onDelete();
      onOpenChange(false);
    } catch {
      toast({ title: '❌ Ошибка', description: 'Не удалось сохранить сценарий', variant: 'destructive' as any });
    } finally {
      setIsSaving(false);
    }
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
            disabled={isSaving}
            className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Сохранить как сценарий и удалить
          </Button>
          <Button variant="destructive" onClick={handleDeleteForever} disabled={isSaving} className="w-full gap-2">
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
