/**
 * @fileoverview Кнопка скачивания архива проекта с медиафайлами.
 */
import { useState } from 'react';
import { WorkspaceActionButton } from '@/components/ui/workspace-action-button';
import { useToast } from '@/hooks/use-toast';

/** Свойства скачивания архива проекта. */
interface CodeArchiveActionProps {
  /** Идентификатор сохранённого проекта. */
  projectId?: number;
}

/**
 * Скачивает архив с кодом и вложениями сохранённого проекта.
 * @param props - Идентификатор проекта.
 * @returns Кнопка скачивания архива.
 */
export function CodeArchiveAction({ projectId }: CodeArchiveActionProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /** Запрашивает архив и сообщает об ошибке подготовки или скачивания. */
  const downloadArchive = async () => {
    if (!projectId || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/export?format=zip`, {
        method: 'POST', credentials: 'include',
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message || 'Не удалось подготовить архив.');
      }
      const url = URL.createObjectURL(await response.blob());
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `bot-${projectId}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({ title: 'Не удалось скачать архив', description: error instanceof Error ? error.message : 'Попробуйте ещё раз.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
    <WorkspaceActionButton onClick={downloadArchive} disabled={!projectId || loading} variant="outline"
      className="code-action w-full px-3 text-sm font-semibold" data-testid="button-download-archive">
      {loading ? 'Подготовка архива…' : 'Скачать архив с файлами'}
    </WorkspaceActionButton>
    <p className="text-xs text-muted-foreground">Архив содержит сохранённую версию проекта и вложения.</p>
    </div>
  );
}
