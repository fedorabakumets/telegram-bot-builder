/**
 * @fileoverview Нейтральная шапка аудитории с выбором проекта, бота и подписанными показателями.
 */
import { Users } from 'lucide-react';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';
import { WorkspaceTabActions } from '@/components/ui/workspace-tab-actions';
import { WorkspaceCollapsibleHeader } from '@/components/ui/workspace-collapsible-header';
import { BotProject } from '@shared/schema';
import { HeaderActions, ProjectSelector } from '../components/header';
import { UsersBotSelector } from '../components/header/users-bot-selector';
import { DatabaseContentProps } from './database-content-props';
import { InlineStatsBadges } from '../components/header/inline-stats-badges';

/** Свойства заголовка аудитории. */
interface DatabaseHeaderSectionProps extends Pick<DatabaseContentProps,
  'projectId' | 'projectName' | 'selectedTokenId' | 'availableTokens' | 'onSelectToken' |
  'isDatabaseEnabled' | 'toggleDatabaseMutation' | 'handleRefresh' |
  'deleteAllUsersMutation' | 'allProjects' | 'onProjectChange' | 'stats'> {
  /** Данные текущего проекта. */
  project: BotProject | null;
}

/**
 * Показывает контекст аудитории и действия над выбранной базой.
 * @param props - Параметры проекта, фильтра бота и статистики.
 * @returns Заголовок вкладки пользователей.
 */
export function DatabaseHeaderSection(props: DatabaseHeaderSectionProps): React.JSX.Element {
  const { projectId, projectName, selectedTokenId, availableTokens, onSelectToken,
    isDatabaseEnabled, handleRefresh, deleteAllUsersMutation, allProjects,
    onProjectChange, stats } = props;
  const showProjects = allProjects && allProjects.length > 1 && onProjectChange;
  return (
    <div className="users-page-header workspace-tab-frame shrink-0">
      <WorkspaceCollapsibleHeader><div className="users-header-content space-y-4">
      <WorkspaceTabHeading title="Пользователи" icon={<Users className="text-blue-500" />}
        description="Личные контакты бота, история общения и ответы."
        actions={<WorkspaceTabActions docsPath="interface/users" section="Пользователи" onRefresh={handleRefresh} />} />
      <div role="group" aria-label="Проект и бот" className="users-scope flex min-w-0 flex-wrap items-center gap-3">
        {showProjects && <ProjectSelector projects={allProjects} selectedProjectId={projectId} onSelect={onProjectChange} />}
        <UsersBotSelector projectId={projectId} tokens={availableTokens}
          selectedTokenId={selectedTokenId} onSelect={onSelectToken} />
      </div>
      {isDatabaseEnabled && <div className="users-header-tools flex flex-wrap items-center justify-between gap-3">
        {stats && <InlineStatsBadges stats={stats} />}
        <div className="shrink-0 ml-auto">
          <HeaderActions projectId={projectId} projectName={projectName}
            selectedTokenId={selectedTokenId} isPending={deleteAllUsersMutation.isPending}
            onRefresh={handleRefresh} onDeleteAll={() => deleteAllUsersMutation.mutate()} />
        </div>
      </div>}
      </div></WorkspaceCollapsibleHeader>
    </div>
  );
}
