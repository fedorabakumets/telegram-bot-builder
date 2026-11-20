/**
 * @fileoverview Вкладка «Владельцы» detail-панели бота
 * Управление участниками проекта в конструкторе.
 * @module bot/canvas/BotCollaboratorsTab
 */

import { ProjectCollaborators } from '../profile/ProjectCollaborators';

/** Пропсы вкладки владельцев */
interface BotCollaboratorsTabProps {
  /** ID проекта */
  projectId: number;
  /** Telegram ID владельца проекта. */
  ownerId: number | null;
  /** Можно ли добавлять/удалять участников */
  canManage: boolean;
}

/**
 * Показывает список участников и управление доступом к проекту.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotCollaboratorsTab({ projectId, ownerId, canManage }: BotCollaboratorsTabProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <ProjectCollaborators projectId={projectId} ownerId={ownerId} canManage={canManage} />
    </div>
  );
}
