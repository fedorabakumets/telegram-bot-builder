/** @fileoverview Сообщение о конфликте версий без изменения локального черновика. */

import { History, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Действия, которые оставляют локальный черновик в редакторе. */
interface ProjectSaveConflictAlertProps {
  /** Сообщение от другого окна или отказ записи из-за новой ревизии. */
  source: 'remote-change' | 'save-conflict';
  /** Открывает историю, сохраняя черновик на холсте. */
  onOpenVersions: () => void;
  /** Копирует черновик, если это действие доступно в текущем режиме. */
  onCopyDraft?: () => void;
  /** Загружает серверную версию после подтверждения сброса. */
  onLoadSaved?: () => void;
}

/**
 * Показывает причину конфликта и позволяет посмотреть сохранённую версию.
 * @param props - Источник конфликта и действия с черновиком.
 * @returns Нескрываемое предупреждение с безопасными действиями.
 */
export function ProjectSaveConflictAlert({ source, onOpenVersions, onCopyDraft, onLoadSaved }: ProjectSaveConflictAlertProps) {
  const writeRejected = source === 'save-conflict';
  return (
    <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/30 sm:px-4">
      {/** Кнопки остаются вне области уведомления, чтобы изменения текста не забирали фокус. */}
      <div role={writeRejected ? 'alert' : 'status'} aria-atomic="true" className="flex min-w-0 flex-1 basis-60 items-start gap-2">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
        <div className="min-w-0 text-xs leading-relaxed text-foreground">
          <p className="font-semibold">
            {writeRejected ? 'Проект изменился после открытия' : 'Проект меняется в другом окне'}
          </p>
          <p className="text-muted-foreground">
            Ваш черновик остался в редакторе. В истории можно посмотреть последнюю сохранённую версию.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onOpenVersions} className="h-8 px-2.5 text-xs">
          <History className="h-3.5 w-3.5" aria-hidden />
          Открыть историю версий
        </Button>
        {onCopyDraft && (
          <Button type="button" variant="ghost" size="sm" onClick={onCopyDraft} className="h-8 px-2.5 text-xs">
            Скопировать черновик
          </Button>
        )}
        {onLoadSaved && (
          <Button type="button" variant="ghost" size="sm" onClick={onLoadSaved} className="h-8 px-2.5 text-xs">
            Загрузить сохранённую версию
          </Button>
        )}
      </div>
    </div>
  );
}
