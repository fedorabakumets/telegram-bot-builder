/** @fileoverview Общие для проекта настройки данных и доступа. */
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import type { BotProject } from '@shared/schema';
import { BotDatabaseToggle } from '../card/BotDatabaseToggle';
import { SettingsSection } from '../card/SettingsSection';
import { BotAdminIds } from '../profile/BotAdminIds';
import { ProjectCollaborators } from '../profile/ProjectCollaborators';

/** Свойства общих настроек проекта. */
interface ProjectCommonSettingsProps {
  /** Проект, для которого редактируются данные и доступ. */
  project: BotProject;
}

/**
 * Показывает общие настройки базы, администраторов сценария и участников конструктора.
 * @param props - Текущий проект.
 * @returns Раздел проектных настроек.
 */
export function ProjectCommonSettings({ project }: ProjectCommonSettingsProps) {
  const { user, isTelegramUser } = useTelegramAuth();
  const canManage = !!user && isTelegramUser(user);

  return (
    <SettingsSection title="База и права проекта">
      {/* Параметр базы применяется ко всем ботам проекта. */}
      <BotDatabaseToggle
        projectId={project.id}
        userDatabaseEnabled={project.userDatabaseEnabled}
        canManage={canManage}
      />
      {/* Доступ к конструктору и права в сценариях хранятся отдельно. */}
      <ProjectCollaborators projectId={project.id} ownerId={project.ownerId} canManage={canManage} />
      <BotAdminIds projectId={project.id} canManage={canManage} />
    </SettingsSection>
  );
}
