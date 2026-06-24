/**
 * @fileoverview Кнопка истории версий проекта в тулбаре холста
 *
 * Открывает попап со списком сохранённых версий проекта и позволяет
 * откатить проект к выбранной версии без ухода с холста.
 *
 * @module editor/canvas/canvas/version-history-button
 */

import { useCallback, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useProjectVersions, useRestoreProjectVersion } from '@/hooks/use-project-versions';
import { VersionRow } from '@/components/editor/versions/version-row';
import { CommitForm } from '@/components/editor/versions/commit-form';

/** Пропсы кнопки истории версий */
export interface VersionHistoryButtonProps {
  /** ID проекта */
  projectId: number;
  /** Колбэк после успешного восстановления версии (перезагрузка холста) */
  onRestored?: () => void;
}

/**
 * Кнопка-иконка истории версий с попапом списка версий
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки с попапом
 */
export function VersionHistoryButton({ projectId, onRestored }: VersionHistoryButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const { data: versions = [], isLoading } = useProjectVersions(projectId);
  const restoreMutation = useRestoreProjectVersion(projectId);

  /** Обработчик восстановления версии проекта */
  const handleRestore = useCallback((versionId: number) => {
    setRestoringId(versionId);
    // Уведомление показываем первым — гарантированно, до обновления холста
    toast({
      title: 'Версия восстановлена',
      description: 'Проект откатан к выбранной версии. Изменения видны на холсте.',
    });
    restoreMutation.mutate(versionId, {
      onSuccess: () => {
        try {
          onRestored?.();
        } catch (err) {
          console.error('[VersionHistoryButton] Ошибка обновления холста после отката:', err);
        }
        setOpen(false);
      },
      onError: () => {
        toast({
          title: 'Ошибка восстановления',
          description: 'Не удалось восстановить версию проекта',
          variant: 'destructive',
        });
      },
      onSettled: () => {
        setRestoringId(null);
      },
    });
  }, [restoreMutation, onRestored, toast]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group flex items-center justify-center"
          title="История версий"
        >
          <i className="fas fa-code-branch text-slate-600 dark:text-slate-400 text-sm group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        className="w-96 p-0 overflow-hidden"
        style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column' }}
      >
        {/* Шапка */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <i className="fas fa-code-branch text-slate-400 dark:text-slate-500 text-xs" />
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">История версий</span>
          {versions.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{versions.length}</span>
          )}
        </div>

        {/* Форма создания чекпоинта */}
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
          <CommitForm projectId={projectId} compact />
        </div>

        {/* Список версий */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-6 text-sm text-slate-400 dark:text-slate-500">Загрузка истории версий…</div>
          ) : versions.length > 0 ? (
            versions.map((version, index) => (
              <VersionRow
                key={version.id}
                version={version}
                projectId={projectId}
                versionNumber={versions.length - index}
                isLatest={index === 0}
                isRestoring={restoringId === version.id}
                compact
                onRestore={handleRestore}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2 px-4 text-center">
              <i className="fas fa-clock-rotate-left text-slate-300 dark:text-slate-600 text-2xl" />
              <p className="text-xs text-slate-400 dark:text-slate-500">Снимки создаются при сохранении проекта</p>
            </div>
          )}
        </div>

        {/* Пояснение: откат не удаляет историю */}
        {versions.length > 0 && (
          <div className="flex-shrink-0 px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50">
            <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              <i className="fas fa-circle-info mr-1 opacity-70" />
              Восстановление не удаляет другие версии — можно вернуться к любой из них.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
