/**
 * @fileoverview Вкладка «Коллабораторы» detail-панели бота
 * Список участников конструктора + плашка о будущих разрешениях.
 * @module bot/canvas/BotCollaboratorsTab
 */

import { Construction } from 'lucide-react';
import { ProjectCollaborators } from '../profile/ProjectCollaborators';

/** Пропсы вкладки коллабораторов */
interface BotCollaboratorsTabProps {
  /** ID проекта */
  projectId: number;
  /** Можно ли добавлять/удалять участников */
  canManage: boolean;
}

/**
 * Контент вкладки: баннер «в разработке» и управление коллабораторами
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotCollaboratorsTab({ projectId, canManage }: BotCollaboratorsTabProps) {
  return (
    <div className="space-y-4">
      <div
        role="status"
        className={[
          'flex gap-3 rounded-lg border border-amber-500/30',
          'bg-amber-500/10 px-3.5 py-3 text-amber-950 dark:text-amber-100',
        ].join(' ')}
      >
        <Construction
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium leading-snug">Панель в разработке</p>
          <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-100/80">
            Скоро появятся разрешения у людей и отвязка от Telegram — пока доступ
            выдаётся по Telegram ID.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        <ProjectCollaborators projectId={projectId} canManage={canManage} />
      </div>
    </div>
  );
}
